$ErrorActionPreference = 'Stop'

$courseRoot = $PSScriptRoot
$expected = @(
    '00_environment',
    '01_model_boundary',
    '02_prompts_and_roles',
    '03_tool_definitions',
    '04_tool_execution',
    '05_agent_loop',
    '06_context_and_cost',
    '07_safety_and_evals',
    '08_self_modification'
)

$requirements = @{
    chapters = @('Last verified: 2026-08-08', '## Main ideas reviewed', '## Current ecosystem', '## What you should now be able to explain', 'Retest')
    labs = @('Last verified: 2026-08-08', '## Goal and constraints', '**Five-minute checkpoint:**', '## Acceptance criteria', '## Hints', '## Stretch')
    instructor = @('Last verified: 2026-08-08', '## Demonstration script', 'Expected', 'fallback', 'Misconceptions')
    slides = @('Last verified: 2026-08-08', '**Prediction:**')
    assessments = @('Last verified: 2026-08-08', '## Questions', 'check:', '## Answer key and misconception notes')
}

$failures = [System.Collections.Generic.List[string]]::new()
foreach ($folder in $requirements.Keys) {
    $files = @(Get-ChildItem -LiteralPath (Join-Path $courseRoot $folder) -Filter '*.md' -File)
    if ($files.Count -ne $expected.Count) {
        $failures.Add("$folder contains $($files.Count) files; expected $($expected.Count).")
    }
    foreach ($stem in $expected) {
        $path = Join-Path $courseRoot "$folder/$stem.md"
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            $failures.Add("Missing $folder/$stem.md")
            continue
        }
        $content = Get-Content -LiteralPath $path -Raw
        foreach ($marker in $requirements[$folder]) {
            if ($content.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
                $failures.Add("$folder/$stem.md lacks marker: $marker")
            }
        }
        if ($folder -eq 'chapters') {
            $sourceLinkCount = ([regex]::Matches($content, 'https://')).Count
            if ($sourceLinkCount -lt 2) {
                $failures.Add("$folder/$stem.md contains $sourceLinkCount web source links; expected at least 2.")
            }
            $wordCount = @($content -split '\s+' | Where-Object { $_ }).Count
            $minimumWords = if ($stem -in @('00_environment', '06_context_and_cost')) { 1000 } else { 1500 }
            if ($wordCount -lt $minimumWords) {
                $failures.Add("$folder/$stem.md contains $wordCount words; expected at least $minimumWords.")
            }
        }
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $courseRoot 'CHAPTER_IDEA_REVIEW.md') -PathType Leaf)) {
    $failures.Add('Missing CHAPTER_IDEA_REVIEW.md.')
}

$checkpointCount = @(Get-ChildItem -LiteralPath (Join-Path $courseRoot 'checkpoints') -Directory).Count
if ($checkpointCount -ne 9) {
    $failures.Add("checkpoints contains $checkpointCount chapter directories; expected 9.")
}

$evalPath = Join-Path $courseRoot 'evals/cases.json'
try {
    $evalCases = Get-Content -LiteralPath $evalPath -Raw | ConvertFrom-Json
    if (@($evalCases).Count -lt 6) { $failures.Add('evals/cases.json must contain at least six deterministic cases.') }
} catch {
    $failures.Add("evals/cases.json is not valid JSON: $($_.Exception.Message)")
}

$fullTracePath = Join-Path $courseRoot 'demos/full_repair_trace.jsonl'
$repeatTracePath = Join-Path $courseRoot 'demos/repeated_read_trace.jsonl'
foreach ($tracePath in @($fullTracePath, $repeatTracePath)) {
    if (-not (Test-Path -LiteralPath $tracePath -PathType Leaf)) {
        $failures.Add("Missing recorded trace: $tracePath")
        continue
    }
    try {
        $traceEvents = @(Get-Content -LiteralPath $tracePath | ForEach-Object { $_ | ConvertFrom-Json })
        if ($traceEvents.Count -eq 0) { $failures.Add("Recorded trace is empty: $tracePath") }
        if (@($traceEvents | Where-Object kind -eq 'model_request').Count -eq 0) {
            $failures.Add("Recorded trace lacks model_request events: $tracePath")
        }
    } catch {
        $failures.Add("Recorded trace is not valid JSONL: $tracePath")
    }
}

if (Test-Path -LiteralPath $fullTracePath) {
    $recordedText = Get-Content -LiteralPath $fullTracePath -Raw
    if ($recordedText.Contains('C:\Users\') -or $recordedText.Contains('C:/Users/')) {
        $failures.Add('Recorded full-repair trace contains a non-portable user path.')
    }
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'Course material verification passed.'
Write-Output '9 manuscripts, 9 labs, 9 instructor guides, 9 slide outlines, 9 assessments, and 9 checkpoints are present.'
