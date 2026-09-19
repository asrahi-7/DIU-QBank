param(
  [string]$BaseUrl = "https://diuqbank.com/questions",
  [string]$OutDir = ".\\exports",
  [int]$MaxRetries = 4,
  [int]$RetryDelaySeconds = 2
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Web

function Get-PagePayload {
  param(
    [string]$Url
  )

  $attempt = 0
  while ($true) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing $Url
      $match = [regex]::Match($response.Content, 'data-page="([\s\S]*?)"')
      if (-not $match.Success) {
        throw "Could not find data-page JSON in response."
      }

      $decoded = [System.Web.HttpUtility]::HtmlDecode($match.Groups[1].Value)
      return ($decoded | ConvertFrom-Json)
    } catch {
      $attempt++
      if ($attempt -ge $MaxRetries) {
        throw "Failed to fetch $Url after $attempt attempts. $($_.Exception.Message)"
      }
      Start-Sleep -Seconds ($RetryDelaySeconds * $attempt)
    }
  }
}

function To-QuestionRecord {
  param(
    [Parameter(Mandatory = $true)]$Question
  )

  [pscustomobject]@{
    id                = $Question.id
    department_id     = $Question.department.id
    department_name   = $Question.department.name
    department_short  = $Question.department.short_name
    course_id         = $Question.course.id
    course_name       = $Question.course.name
    semester_id       = $Question.semester.id
    semester_name     = $Question.semester.name
    exam_type_id      = $Question.exam_type.id
    exam_type_name    = $Question.exam_type.name
    submissions_count = $Question.submissions_count
    created_at        = $Question.created_at
    source_url        = "https://diuqbank.com/questions/$($Question.id)"
  }
}

if (-not (Test-Path -LiteralPath $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$runAtUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedAt = Get-Date
Write-Host "Fetching DIUQBank pages from $BaseUrl ..."

$first = Get-PagePayload -Url "${BaseUrl}?page=1"
$meta = $first.props.questions.meta
$lastPage = [int]$meta.last_page
$expectedTotal = [int]$meta.total
$perPage = [int]$meta.per_page

Write-Host "Detected total=$expectedTotal, pages=$lastPage, per_page=$perPage"

$allRaw = @()
$allRaw += $first.props.questions.data

for ($page = 2; $page -le $lastPage; $page++) {
  Write-Host "Page $page / $lastPage"
  $payload = Get-PagePayload -Url "${BaseUrl}?page=$page"
  $allRaw += $payload.props.questions.data
}

$allRecords = @($allRaw | ForEach-Object { To-QuestionRecord -Question $_ })
$distinctRecords = @($allRecords | Sort-Object id -Unique)

$actualTotal = $allRecords.Count
$distinctTotal = $distinctRecords.Count
$missingCount = $expectedTotal - $distinctTotal
$duplicates = $actualTotal - $distinctTotal

$summary = [pscustomobject]@{
  fetched_at_utc             = $runAtUtc
  base_url                   = $BaseUrl
  expected_total_from_site   = $expectedTotal
  pages_crawled              = $lastPage
  per_page                   = $perPage
  records_fetched            = $actualTotal
  distinct_records_by_id     = $distinctTotal
  duplicate_records_removed  = $duplicates
  missing_vs_expected        = $missingCount
  complete_match             = ($missingCount -eq 0)
  duration_seconds           = [math]::Round(((Get-Date) - $startedAt).TotalSeconds, 2)
}

$jsonPath = Join-Path $OutDir "diuqbank_questions_all.json"
$csvPath = Join-Path $OutDir "diuqbank_questions_all.csv"
$summaryPath = Join-Path $OutDir "diuqbank_export_summary.json"

$distinctRecords | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
$distinctRecords | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
$summary | ConvertTo-Json -Depth 5 | Set-Content -Path $summaryPath -Encoding UTF8

Write-Host ""
Write-Host "Export complete."
Write-Host "JSON: $jsonPath"
Write-Host "CSV:  $csvPath"
Write-Host "Meta: $summaryPath"
Write-Host ""
Write-Host ($summary | ConvertTo-Json -Depth 5)
