Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$courseRoot = $PSScriptRoot
$repositoryRoot = Split-Path -Parent $courseRoot
$verifiedDate = '2026-08-09'
$auditDate = '2026-08-10'
$expectedStems = @(
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
$checkpointIds = @(
    '00_api_smoke',
    '01_messages',
    '02_prompt_lab',
    '03_tool_schema',
    '04_tool_dispatch',
    '05_agent_loop',
    '06_trace_and_limits',
    '07_safe_agent',
    '08_capstone_solution'
)
$slideTargets = @(6, 8, 8, 8, 10, 10, 6, 8, 6)
$manuscriptTargets = @(1000, 1500, 1800, 2000, 2500, 2500, 1200, 2000, 2000)
$failures = [System.Collections.Generic.List[string]]::new()

function Add-Failure {
    param([Parameter(Mandatory)][string]$Message)
    [void]$script:failures.Add($Message)
}

function Get-CoursePath {
    param([Parameter(Mandatory)][string]$RelativePath)
    return Join-Path $courseRoot $RelativePath
}

function Require-File {
    param(
        [Parameter(Mandatory)][string]$RelativePath,
        [int64]$MinimumBytes = 1
    )
    $path = Get-CoursePath $RelativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        Add-Failure "Missing course/$RelativePath."
        return $null
    }
    $length = (Get-Item -LiteralPath $path).Length
    if ($length -lt $MinimumBytes) {
        Add-Failure "course/$RelativePath is only $length bytes; expected at least $MinimumBytes."
    }
    return $path
}

function Read-RequiredText {
    param(
        [Parameter(Mandatory)][string]$RelativePath,
        [int64]$MinimumBytes = 1
    )
    $path = Require-File $RelativePath $MinimumBytes
    if ($null -eq $path) { return $null }
    try {
        return Get-Content -LiteralPath $path -Raw -Encoding UTF8
    } catch {
        Add-Failure "Could not read course/$RelativePath as UTF-8 text: $($_.Exception.Message)"
        return $null
    }
}

function Require-Markers {
    param(
        [Parameter(Mandatory)][string]$Label,
        [AllowNull()][string]$Content,
        [Parameter(Mandatory)][string[]]$Markers
    )
    if ($null -eq $Content) { return }
    foreach ($marker in $Markers) {
        if ($Content.IndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
            Add-Failure "$Label lacks required marker: $marker"
        }
    }
}

function Convert-RequiredJson {
    param([Parameter(Mandatory)][string]$RelativePath)
    $content = Read-RequiredText $RelativePath 2
    if ($null -eq $content) { return $null }
    try {
        return $content | ConvertFrom-Json
    } catch {
        Add-Failure "course/$RelativePath is not valid JSON: $($_.Exception.Message)"
        return $null
    }
}

function Has-Property {
    param(
        [AllowNull()][object]$Object,
        [Parameter(Mandatory)][string]$Name
    )
    return $null -ne $Object -and $null -ne $Object.PSObject.Properties[$Name]
}

# The five chapter package collections must be complete, exact, and freshly reviewed.
$packageMarkers = @{
    chapters = @("Last verified: $verifiedDate", "## What you'll learn and prove", '## Current ecosystem', '## What you should now be able to explain', 'Retest')
    labs = @("Last verified: $verifiedDate", 'Start: `checkpoints/', '## Goal and constraints', '**Five-minute checkpoint:**', '## Acceptance criteria', '## Hints', '## Stretch')
    instructor = @("Last verified: $verifiedDate", '## Demonstration script', 'Expected', 'fallback', 'Misconceptions')
    slides = @("Last verified: $verifiedDate", '**Prediction:**')
    assessments = @("Last verified: $verifiedDate", '## Questions', 'Trace reading:', '## Answer key and misconception notes')
}

foreach ($folder in @('chapters', 'labs', 'instructor', 'slides', 'assessments')) {
    $directory = Get-CoursePath $folder
    if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
        Add-Failure "Missing course/$folder directory."
        continue
    }
    $actualNames = @(Get-ChildItem -LiteralPath $directory -Filter '*.md' -File | ForEach-Object Name | Sort-Object)
    $expectedNames = @($expectedStems | ForEach-Object { "$_.md" } | Sort-Object)
    $allowedExtras = @(if ($folder -eq 'slides') { 'README.md' })
    $expectedCount = 9 + $allowedExtras.Count
    if ($actualNames.Count -ne $expectedCount) {
        Add-Failure "course/$folder contains $($actualNames.Count) Markdown files; expected exactly $expectedCount."
    }
    foreach ($expectedName in $expectedNames) {
        if ($expectedName -notin $actualNames) { Add-Failure "course/$folder is missing $expectedName." }
    }
    foreach ($actualName in $actualNames) {
        if ($actualName -notin $expectedNames -and $actualName -notin $allowedExtras) { Add-Failure "course/$folder contains unexpected package file $actualName." }
    }
}

for ($index = 0; $index -lt $expectedStems.Count; $index += 1) {
    $stem = $expectedStems[$index]
    foreach ($folder in $packageMarkers.Keys) {
        $relative = "$folder/$stem.md"
        $content = Read-RequiredText $relative 100
        Require-Markers "course/$relative" $content $packageMarkers[$folder]
        if ($null -eq $content) { continue }

        if ($folder -eq 'chapters') {
            $sourceLinkCount = [regex]::Matches($content, 'https://').Count
            if ($sourceLinkCount -lt 2) {
                Add-Failure "course/$relative contains $sourceLinkCount HTTPS research links; expected at least 2."
            }
            $wordCount = @($content -split '\s+' | Where-Object { $_ }).Count
            if ($wordCount -lt $manuscriptTargets[$index]) {
                Add-Failure "course/$relative contains $wordCount words; the production target is $($manuscriptTargets[$index])."
            }
        }

        if ($folder -eq 'labs') {
            if ($content.IndexOf("checkpoints/$($checkpointIds[$index])", [System.StringComparison]::Ordinal) -lt 0) {
                Add-Failure "course/$relative does not start from checkpoints/$($checkpointIds[$index])."
            }
            $hintMatch = [regex]::Match($content, '(?ms)^## Hints\s*(?<body>.*?)(?=^## |\z)')
            $hintCount = if ($hintMatch.Success) { [regex]::Matches($hintMatch.Groups['body'].Value, '(?m)^\d+\.\s+').Count } else { 0 }
            if ($hintCount -ne 3) { Add-Failure "course/$relative contains $hintCount numbered hints; expected exactly 3." }
        }

        if ($folder -eq 'instructor') {
            if ($content.IndexOf('Exact', [System.StringComparison]::OrdinalIgnoreCase) -lt 0 -and
                $content.IndexOf('raw JSONL trace', [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
                Add-Failure "course/$relative must provide an exact prompt/input or explicitly use the raw JSONL trace."
            }
        }

        if ($folder -eq 'slides') {
            $numberedSlides = [regex]::Matches($content, '(?m)^\d+\.\s+').Count
            if ($numberedSlides -ne $slideTargets[$index]) {
                Add-Failure "course/$relative contains $numberedSlides numbered slides; expected exactly $($slideTargets[$index])."
            }
            if ($content.IndexOf("Target: $($slideTargets[$index]) slides", [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
                Add-Failure "course/$relative does not declare its exact $($slideTargets[$index])-slide target."
            }
        }

        if ($folder -eq 'assessments') {
            $questionsMatch = [regex]::Match($content, '(?ms)^## Questions\s*(?<body>.*?)(?=^## |\z)')
            $questionCount = if ($questionsMatch.Success) { [regex]::Matches($questionsMatch.Groups['body'].Value, '(?m)^\d+\.\s+').Count } else { 0 }
            if ($questionCount -lt 4) {
                Add-Failure "course/$relative contains $questionCount assessment questions; expected two concepts, one trace item, and one executable check."
            }
            if ($content.IndexOf('Executable check:', [System.StringComparison]::OrdinalIgnoreCase) -lt 0 -and
                $content.IndexOf('Inspectable check:', [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
                Add-Failure "course/$relative lacks an executable or inspectable acceptance check."
            }
        }
    }
}

# Raw request/response fallbacks are chapter-specific and explicitly synthetic unless captured live.
$fixtureNames = @(
    '00_preflight.json',
    '01_model_boundary.json',
    '02_prompt_roles.json',
    '03_tool_definition.json',
    '04_tool_result_roundtrip.json',
    '05_agent_loop.json',
    '06_context_cost.json',
    '07_safety_eval.json',
    '08_capstone_review.json'
)
$fixtureDirectory = Get-CoursePath 'demos/chapter_fixtures'
$actualFixtureNames = if (Test-Path -LiteralPath $fixtureDirectory -PathType Container) {
    @(Get-ChildItem -LiteralPath $fixtureDirectory -Filter '*.json' -File | ForEach-Object Name | Sort-Object)
} else {
    @()
    Add-Failure 'Missing course/demos/chapter_fixtures directory.'
}
if ($actualFixtureNames.Count -ne 9) {
    Add-Failure "course/demos/chapter_fixtures contains $($actualFixtureNames.Count) JSON fixtures; expected exactly 9."
}
for ($index = 0; $index -lt $fixtureNames.Count; $index += 1) {
    $fixtureName = $fixtureNames[$index]
    if ($fixtureName -notin $actualFixtureNames) {
        Add-Failure "Missing per-chapter raw fixture course/demos/chapter_fixtures/$fixtureName."
        continue
    }
    $fixture = Convert-RequiredJson "demos/chapter_fixtures/$fixtureName"
    if ($null -eq $fixture) { continue }
    if (-not (Has-Property $fixture 'fixture_kind') -or $fixture.fixture_kind -ne 'authored_deterministic_wire_fixture') {
        Add-Failure "course/demos/chapter_fixtures/$fixtureName lacks authored deterministic provenance."
    }
    if (-not (Has-Property $fixture 'chapter') -or [int]$fixture.chapter -ne $index) {
        Add-Failure "course/demos/chapter_fixtures/$fixtureName does not identify chapter $index."
    }
    if (-not (Has-Property $fixture 'captured_live') -or $fixture.captured_live -ne $false) {
        Add-Failure "course/demos/chapter_fixtures/$fixtureName must explicitly say captured_live=false."
    }
    foreach ($field in @('purpose', 'request', 'response')) {
        if (-not (Has-Property $fixture $field) -or $null -eq $fixture.$field) {
            Add-Failure "course/demos/chapter_fixtures/$fixtureName lacks non-null $field data."
        }
    }
}

# Parse every JSONL artifact and verify that provenance claims match the catalog.
$demoCatalog = Read-RequiredText 'demos/README.md' 500
Require-Markers 'course/demos/README.md' $demoCatalog @("Last reviewed: $auditDate", 'captured_reference', 'authored_deterministic_fixture', '`pending`')
$jsonlDirectory = Get-CoursePath 'demos'
$traceEventsByName = @{}
if (Test-Path -LiteralPath $jsonlDirectory -PathType Container) {
    foreach ($file in Get-ChildItem -LiteralPath $jsonlDirectory -Filter '*.jsonl' -File) {
        $events = [System.Collections.Generic.List[object]]::new()
        $lineNumber = 0
        foreach ($line in Get-Content -LiteralPath $file.FullName -Encoding UTF8) {
            $lineNumber += 1
            if ([string]::IsNullOrWhiteSpace($line)) { continue }
            try {
                $event = $line | ConvertFrom-Json
                if (-not (Has-Property $event 'kind') -or [string]::IsNullOrWhiteSpace([string]$event.kind)) {
                    Add-Failure "course/demos/$($file.Name) line $lineNumber lacks a non-empty kind."
                }
                [void]$events.Add($event)
            } catch {
                Add-Failure "course/demos/$($file.Name) line $lineNumber is invalid JSON: $($_.Exception.Message)"
            }
        }
        if ($events.Count -eq 0) { Add-Failure "course/demos/$($file.Name) is empty." }
        $traceEventsByName[$file.Name] = @($events)
    }
}

$expectedJsonlNames = @(
    'capstone_trace.jsonl',
    'capstone_trace_template.jsonl',
    'empty_final_trace.jsonl',
    'false_success_failure_trace.jsonl',
    'full_repair_trace.jsonl',
    'live_provider_trace_template.jsonl',
    'malformed_arguments_failure_trace.jsonl',
    'path_escape_failure_trace.jsonl',
    'repeated_read_trace.jsonl'
)
foreach ($name in $expectedJsonlNames) {
    if (-not $traceEventsByName.ContainsKey($name)) { Add-Failure "Missing course/demos/$name." }
}
foreach ($name in $traceEventsByName.Keys) {
    if ($name -notin $expectedJsonlNames) { Add-Failure "course/demos/$name has no verifier provenance classification." }
}

foreach ($templateName in @('capstone_trace_template.jsonl', 'live_provider_trace_template.jsonl')) {
    if (-not $traceEventsByName.ContainsKey($templateName)) {
        Add-Failure "Missing pending capture template course/demos/$templateName."
        continue
    }
    $first = @($traceEventsByName[$templateName])[0]
    if (-not (Has-Property $first 'capture_status') -or $first.capture_status -ne 'pending') {
        Add-Failure "course/demos/$templateName must remain explicitly pending until a real capture replaces it."
    }
    if (-not (Has-Property $first 'warning')) {
        Add-Failure "course/demos/$templateName needs a warning that it is not execution evidence."
    }
}

foreach ($capturedName in @('full_repair_trace.jsonl', 'repeated_read_trace.jsonl', 'empty_final_trace.jsonl')) {
    if (-not $traceEventsByName.ContainsKey($capturedName)) {
        Add-Failure "Missing captured reference trace course/demos/$capturedName."
        continue
    }
    $events = @($traceEventsByName[$capturedName])
    $kinds = @($events | ForEach-Object { [string]$_.kind })
    foreach ($requiredKind in @('model_request', 'model_response')) {
        if ($requiredKind -notin $kinds) { Add-Failure "course/demos/$capturedName lacks $requiredKind evidence." }
    }
    if ($null -ne $demoCatalog) {
        $catalogPattern = [regex]::Escape("``$capturedName``") + '\s*\|\s*captured reference executable'
        if ($demoCatalog -notmatch $catalogPattern) {
            Add-Failure "course/demos/README.md does not catalog $capturedName as captured reference executable evidence."
        }
    }
}

if ($traceEventsByName.ContainsKey('capstone_trace.jsonl')) {
    $capstoneEvents = @($traceEventsByName['capstone_trace.jsonl'])
    $first = $capstoneEvents[0]
    if ($first.kind -ne 'metadata' -or -not (Has-Property $first 'detail') -or
        -not (Has-Property $first.detail 'provenance') -or $first.detail.provenance -ne 'captured_deterministic_capstone') {
        Add-Failure 'course/demos/capstone_trace.jsonl lacks captured_deterministic_capstone provenance.'
    }
    $capstoneKinds = @($capstoneEvents | ForEach-Object { [string]$_.kind })
    foreach ($kind in @('baseline_inspection', 'change_proposal', 'process_result', 'review_gate', 'completion')) {
        if ($kind -notin $capstoneKinds) { Add-Failure "course/demos/capstone_trace.jsonl lacks $kind evidence." }
    }
    if ('human_review' -in $capstoneKinds) {
        Add-Failure 'course/demos/capstone_trace.jsonl must not attest a human review performed by the automated capture script.'
    }
    if ($null -ne $demoCatalog) {
        $catalogPattern = [regex]::Escape('`capstone_trace.jsonl`') + '\s*\|\s*captured deterministic checkpoint fallback'
        if ($demoCatalog -notmatch $catalogPattern) {
            Add-Failure 'course/demos/README.md does not catalog capstone_trace.jsonl as captured deterministic checkpoint-fallback evidence.'
        }
    }
}

$authoredFailures = @(
    'path_escape_failure_trace.jsonl',
    'malformed_arguments_failure_trace.jsonl',
    'false_success_failure_trace.jsonl'
)
foreach ($failureName in $authoredFailures) {
    if (-not $traceEventsByName.ContainsKey($failureName)) {
        Add-Failure "Missing authored failure trace course/demos/$failureName."
        continue
    }
    $events = @($traceEventsByName[$failureName])
    $first = $events[0]
    if (-not (Has-Property $first 'provenance') -or $first.provenance -ne 'authored_deterministic_fixture') {
        Add-Failure "course/demos/$failureName does not declare authored_deterministic_fixture provenance in its first event."
    }
    if (-not (Has-Property $first 'captured_from_executable') -or $first.captured_from_executable -ne $false) {
        Add-Failure "course/demos/$failureName must explicitly say captured_from_executable=false."
    }
    if (-not (@($events | Where-Object { $_.kind -in @('stop', 'evaluation') }).Count)) {
        Add-Failure "course/demos/$failureName lacks a stop/evaluation outcome."
    }
}
$failureEvidenceNames = @($authoredFailures + @('repeated_read_trace.jsonl', 'empty_final_trace.jsonl') | Where-Object { $traceEventsByName.ContainsKey($_) })
if ($failureEvidenceNames.Count -lt 3) {
    Add-Failure "Only $($failureEvidenceNames.Count) distinct failure traces are present; expected at least 3."
}

if ($traceEventsByName.ContainsKey('full_repair_trace.jsonl')) {
    $fullKinds = @($traceEventsByName['full_repair_trace.jsonl'] | ForEach-Object { [string]$_.kind })
    foreach ($kind in @('model_request', 'model_response', 'tool_request', 'tool_result', 'final')) {
        if ($kind -notin $fullKinds) { Add-Failure "course/demos/full_repair_trace.jsonl lacks $kind evidence." }
    }
}

# Named chapter production assets must exist and JSON assets must parse.
$namedAssets = @(
    'assets/README.md',
    'assets/chapter_00/SETUP.md',
    'assets/chapter_00/sanitized_response.json',
    'assets/chapter_00/TROUBLESHOOTING.md',
    'assets/chapter_00/MODEL_SELECTION.md',
    'assets/chapter_00/model_selection_2026-08-10.json',
    'assets/chapter_00/LIVE_GATE_RUNBOOK.md',
    'assets/chapter_01/EXPERIMENT_REPORT.md',
    'assets/chapter_02/PROMPT_WORKSHEET.md',
    'assets/chapter_02/cases.json',
    'assets/chapter_02/deterministic_outputs.json',
    'assets/chapter_02/prompts/evidence_first_agent.txt',
    'assets/chapter_02/prompts/grumpy_reviewer.txt',
    'assets/chapter_02/prompts/helpful_partner.txt',
    'assets/chapter_02/prompts/standards_lawyer.txt',
    'assets/chapter_04/COMMAND_POLICY.md',
    'assets/chapter_04/fake_tool_calls.json',
    'assets/chapter_04/path_cases.json',
    'assets/chapter_04/TRANSCRIPT_WORKSHEET.md',
    'assets/chapter_07/red_team_fixture_source.txt',
    'assets/chapter_07/RED_TEAM_WORKSHEET.md',
    'assets/chapter_07/THREAT_MATRIX.md',
    'assets/chapter_08/CAPSTONE_CONTRACT.md',
    'assets/chapter_08/CAPSTONE_REVIEW.md',
    'assets/chapter_08/ISOLATION_CHECKLIST.md',
    'assets/chapter_08/RECOVERY_RUNBOOK.md'
)
foreach ($asset in $namedAssets) {
    [void](Require-File $asset 40)
    if ([System.IO.Path]::GetExtension($asset) -eq '.json') { [void](Convert-RequiredJson $asset) }
}

$modelSelection = Convert-RequiredJson 'assets/chapter_00/model_selection_2026-08-10.json'
if ($null -ne $modelSelection) {
    if (-not (Has-Property $modelSelection 'capture_kind') -or $modelSelection.capture_kind -ne 'public_model_catalog_check' -or
        -not (Has-Property $modelSelection 'captured_live_completion') -or $modelSelection.captured_live_completion -ne $false) {
        Add-Failure 'The Chapter 0 model selection must identify public catalog evidence without claiming a live completion.'
    }
    $selections = if (Has-Property $modelSelection 'selection') { @($modelSelection.selection) } else { @() }
    if ($selections.Count -ne 2) {
        Add-Failure "The Chapter 0 model selection contains $($selections.Count) candidates; expected primary and fallback."
    } else {
        foreach ($selection in $selections) {
            foreach ($field in @('role', 'request_id', 'single_model_http_status', 'canonical_slug', 'context_length', 'supports_tools', 'supports_tool_choice', 'authenticated_preflight')) {
                if (-not (Has-Property $selection $field)) { Add-Failure "Model selection entry lacks $field." }
            }
            if ((Has-Property $selection 'single_model_http_status') -and [int]$selection.single_model_http_status -ne 200) {
                Add-Failure "Model selection $($selection.request_id) was not retained from a successful public lookup."
            }
            if ((Has-Property $selection 'supports_tools') -and $selection.supports_tools -ne $true) {
                Add-Failure "Model selection $($selection.request_id) does not advertise tools."
            }
            if ((Has-Property $selection 'authenticated_preflight') -and $selection.authenticated_preflight -ne 'pending') {
                Add-Failure "Model selection $($selection.request_id) must remain pending until authenticated evidence is reviewed."
            }
        }
    }
}

$liveGateRunnerPath = Require-File 'scripts/run-live-gates.ps1' 3000
if ($null -ne $liveGateRunnerPath) {
    $liveGateRunnerText = Get-Content -LiteralPath $liveGateRunnerPath -Raw
    Require-Markers 'course/scripts/run-live-gates.ps1' $liveGateRunnerText @(
        'OPENROUTER_API_KEY is required',
        'exactly three trials per E1-E5 case',
        'pending_second_person_redaction_and_assertion_review',
        'Assert-UnderRoot',
        'captured_live_unreviewed'
    )
    try {
        $dryRunText = (& $liveGateRunnerPath -DryRun -Trials 3 | Out-String)
        $dryRunPlan = $dryRunText | ConvertFrom-Json
        if ($dryRunPlan.mode -ne 'dry_run' -or [int]$dryRunPlan.trials_per_case -ne 3 -or
            [int]$dryRunPlan.planned_trial_count -ne 15 -or @($dryRunPlan.cases).Count -ne 5) {
            Add-Failure 'The live-gate dry run must describe exactly E1-E5 with three trials each (15 total).'
        }
        $dryRunIds = @($dryRunPlan.cases | ForEach-Object { [string]$_.id })
        if (($dryRunIds -join ',') -ne 'E1,E2,E3,E4,E5') {
            Add-Failure "The live-gate dry run returned unexpected case order: $($dryRunIds -join ',')."
        }
    } catch {
        Add-Failure "The live-gate dry-run verifier failed: $($_.Exception.Message)"
    }
}

# Wrap-up, pilot, delivery, and completion ledgers are required, while external evidence remains honest.
$governanceFiles = @{
    'WRAP_UP.md' = @("Last reviewed: $verifiedDate", '## Ten-minute exit check', '## Final 20-point rubric', '## Minimum course-completion gates')
    'PILOT.md' = @("Repository review date: $auditDate", 'Status: **UNEXECUTED', 'two experienced C++ developers', '## Timing and activity log', 'Pilot executed: **no**')
    'DELIVERY_GATES.md' = @("Last reviewed: $auditDate", '## Repository gates', 'EXTERNAL_PENDING', 'EVENT_TIME', '## Go/no-go rule')
    'PLAN_COMPLETION_MATRIX.md' = @("Audit date: $auditDate", 'Authoritative plan:', '## Course design and package standard', '## Honest completion rule')
}
foreach ($entry in $governanceFiles.GetEnumerator()) {
    $content = Read-RequiredText $entry.Key 300
    Require-Markers "course/$($entry.Key)" $content $entry.Value
}

# Evaluation cases are executable contracts, not a list of labels.
$evalCases = Convert-RequiredJson 'evals/cases.json'
$evalBaseline = Convert-RequiredJson 'evals/deterministic_baseline_report.json'
$expectedEvalIds = @('E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7')
if ($null -ne $evalCases) {
    $cases = @($evalCases)
    if ($cases.Count -ne $expectedEvalIds.Count) {
        Add-Failure "course/evals/cases.json contains $($cases.Count) cases; expected exactly $($expectedEvalIds.Count)."
    }
    $seenEvalIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    for ($index = 0; $index -lt $cases.Count; $index += 1) {
        $case = $cases[$index]
        foreach ($field in @('id', 'name', 'input', 'assertions')) {
            if (-not (Has-Property $case $field)) { Add-Failure "Evaluation case at index $index lacks $field." }
        }
        if (-not (Has-Property $case 'id')) { continue }
        $id = [string]$case.id
        if (-not $seenEvalIds.Add($id)) { Add-Failure "Duplicate evaluation id $id." }
        if ($index -lt $expectedEvalIds.Count -and $id -ne $expectedEvalIds[$index]) {
            Add-Failure "Evaluation index $index is $id; expected $($expectedEvalIds[$index])."
        }
        if ((Has-Property $case 'name') -and [string]::IsNullOrWhiteSpace([string]$case.name)) { Add-Failure "$id has an empty name." }
        if ((Has-Property $case 'input') -and [string]::IsNullOrWhiteSpace([string]$case.input)) { Add-Failure "$id has an empty input." }
        if (Has-Property $case 'assertions') {
            $assertions = @($case.assertions)
            if ($assertions.Count -eq 0 -or @($assertions | Where-Object { [string]::IsNullOrWhiteSpace([string]$_) }).Count -gt 0) {
                Add-Failure "$id must contain one or more non-empty assertions."
            }
        }
    }
}
if ($null -ne $evalBaseline) {
    if (-not (Has-Property $evalBaseline 'provenance') -or $evalBaseline.provenance -ne 'captured_reference_tests') {
        Add-Failure 'course/evals/deterministic_baseline_report.json lacks captured_reference_tests provenance.'
    }
    if (-not (Has-Property $evalBaseline 'mode') -or $evalBaseline.mode -ne 'deterministic' -or
        -not (Has-Property $evalBaseline 'passed') -or $evalBaseline.passed -ne $true) {
        Add-Failure 'course/evals/deterministic_baseline_report.json must be a passing deterministic capture.'
    }
    $baselineCases = if (Has-Property $evalBaseline 'cases') { @($evalBaseline.cases) } else { @() }
    if ($baselineCases.Count -ne $expectedEvalIds.Count) {
        Add-Failure "course/evals/deterministic_baseline_report.json contains $($baselineCases.Count) cases; expected 7."
    } else {
        for ($index = 0; $index -lt $expectedEvalIds.Count; $index += 1) {
            if ($baselineCases[$index].id -ne $expectedEvalIds[$index] -or $baselineCases[$index].passed -ne $true) {
                Add-Failure "Deterministic baseline case $($expectedEvalIds[$index]) is missing, reordered, or failing."
            }
        }
    }
}
$evalRunner = Read-RequiredText 'scripts/run-evals.mjs' 1000
Require-Markers 'course/scripts/run-evals.mjs' $evalRunner @('evals", "cases.json', '--tests-regex', 'mode: "deterministic"', 'provenance: "captured_reference_tests"', 'passed: results.every')
$cmakeText = Read-RequiredText 'reference/CMakeLists.txt' 500
if ($null -ne $cmakeText) {
    foreach ($evalId in $expectedEvalIds) {
        if ($cmakeText.IndexOf("eval-$evalId", [System.StringComparison]::Ordinal) -lt 0) {
            Add-Failure "course/reference/CMakeLists.txt does not register executable evaluation eval-$evalId."
        }
    }
}

# Checkpoints must carry meaningful manifests/diffs, then pass the no-drift materializer's own self-test.
$checkpointManifest = Convert-RequiredJson 'checkpoints/manifest.json'
$checkpointIntegrity = Convert-RequiredJson 'checkpoints/integrity.json'
if ($null -ne $checkpointManifest) {
    if (-not (Has-Property $checkpointManifest 'schemaVersion') -or [int]$checkpointManifest.schemaVersion -ne 1) {
        Add-Failure 'course/checkpoints/manifest.json has an unsupported schemaVersion.'
    }
    Require-Markers 'course/checkpoints/manifest.json' (Get-Content -LiteralPath (Get-CoursePath 'checkpoints/manifest.json') -Raw) @('"canonicalSource": "../reference"', '"sharedFixture": "../fixture"')
    $manifestEntries = if (Has-Property $checkpointManifest 'checkpoints') { @($checkpointManifest.checkpoints) } else { @() }
    if ($manifestEntries.Count -ne 9) { Add-Failure "Checkpoint manifest contains $($manifestEntries.Count) entries; expected exactly 9." }
    for ($index = 0; $index -lt $checkpointIds.Count; $index += 1) {
        $id = $checkpointIds[$index]
        $directory = Get-CoursePath "checkpoints/$id"
        if (-not (Test-Path -LiteralPath $directory -PathType Container)) {
            Add-Failure "Missing course/checkpoints/$id directory."
            continue
        }
        $actualNames = @(Get-ChildItem -LiteralPath $directory -File | ForEach-Object Name | Sort-Object)
        foreach ($name in @('README.md', 'checkpoint.json', 'answer.patch', 'from_previous.patch')) {
            if ($name -notin $actualNames) { Add-Failure "course/checkpoints/$id lacks $name." }
        }
        [void](Require-File "checkpoints/$id/README.md" 250)
        $answerPath = Require-File "checkpoints/$id/answer.patch" 100
        $previousPath = Require-File "checkpoints/$id/from_previous.patch" 20
        $metadata = Convert-RequiredJson "checkpoints/$id/checkpoint.json"
        if ($null -ne $metadata) {
            if (-not (Has-Property $metadata 'id') -or $metadata.id -ne $id) { Add-Failure "course/checkpoints/$id/checkpoint.json has the wrong id." }
            if (-not (Has-Property $metadata 'order') -or [int]$metadata.order -ne $index) { Add-Failure "course/checkpoints/$id/checkpoint.json has the wrong order." }
            foreach ($field in @('feature', 'focusFiles', 'releaseGate', 'materialize', 'verify', 'starter', 'solution', 'answerDiff', 'previousCheckpointDiff')) {
                if (-not (Has-Property $metadata $field)) { Add-Failure "course/checkpoints/$id/checkpoint.json lacks $field." }
            }
            if ((Has-Property $metadata 'focusFiles') -and @($metadata.focusFiles).Count -eq 0) {
                Add-Failure "course/checkpoints/$id/checkpoint.json has no focus files."
            }
        }
        if ($null -ne $answerPath) {
            $answer = Get-Content -LiteralPath $answerPath -Raw
            if ($answer -notmatch '(?m)^--- a/.+' -or $answer -notmatch '(?m)^\+\+\+ b/.+' -or $answer -notmatch '(?m)^@@ ') {
                Add-Failure "course/checkpoints/$id/answer.patch is not a meaningful unified diff."
            }
        }
        if ($index -gt 0 -and $null -ne $previousPath) {
            $previous = Get-Content -LiteralPath $previousPath -Raw
            if ($previous -notmatch '(?m)^--- a/.+' -or $previous -notmatch '(?m)^\+\+\+ b/.+') {
                Add-Failure "course/checkpoints/$id/from_previous.patch is not a meaningful prior-checkpoint diff."
            }
        }
        if ($index -lt $manifestEntries.Count) {
            $entry = $manifestEntries[$index]
            if (-not (Has-Property $entry 'id') -or $entry.id -ne $id -or -not (Has-Property $entry 'order') -or [int]$entry.order -ne $index) {
                Add-Failure "Checkpoint manifest entry $index does not match $id."
            }
        }
    }
}
if ($null -ne $checkpointIntegrity) {
    if (-not (Has-Property $checkpointIntegrity 'canonical') -or -not (Has-Property $checkpointIntegrity 'sharedFixture') -or
        -not (Has-Property $checkpointIntegrity 'checkpoints') -or @($checkpointIntegrity.checkpoints).Count -ne 9) {
        Add-Failure 'course/checkpoints/integrity.json must cover the canonical source, shared fixture, and all 9 checkpoints.'
    }
}
$materializerPath = Require-File 'scripts/checkpoints.mjs' 5000
if ($null -ne $materializerPath) {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -eq $nodeCommand) {
        Add-Failure 'Node.js is required to execute the checkpoint materializer check.'
    } else {
        Push-Location $repositoryRoot
        try {
            & $nodeCommand.Source $materializerPath check
            if ($LASTEXITCODE -ne 0) { Add-Failure "Checkpoint materializer check exited $LASTEXITCODE." }
        } catch {
            Add-Failure "Checkpoint materializer check failed: $($_.Exception.Message)"
        } finally {
            Pop-Location
        }
    }
}

# The authored PowerPoint is a validated 70-slide artifact, with retained generation source and a source block in every notes page.
$deckXmlFragments = [System.Collections.Generic.List[string]]::new()
$deckSource = Require-File 'slides/build_deck.mjs' 1000
$deckPath = Require-File 'slides/Coding_Agent_Workshop.pptx' 50000
if ($null -ne $deckSource) {
    $deckSourceText = Get-Content -LiteralPath $deckSource -Raw
    Require-Markers 'course/slides/build_deck.mjs' $deckSourceText @('Coding_Agent_Workshop.pptx', 'pptx')
}
if ($null -ne $deckPath) {
    try {
        Add-Type -AssemblyName System.IO.Compression -ErrorAction SilentlyContinue
        Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
        $stream = [System.IO.File]::OpenRead($deckPath)
        try {
            $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Read, $false)
            try {
                $slideEntries = @($archive.Entries | Where-Object { $_.FullName -match '^ppt/slides/slide\d+\.xml$' })
                $notesEntries = @($archive.Entries | Where-Object { $_.FullName -match '^ppt/notesSlides/notesSlide\d+\.xml$' })
                if ($slideEntries.Count -ne 70) { Add-Failure "course/slides/Coding_Agent_Workshop.pptx contains $($slideEntries.Count) slides; expected exactly 70." }
                if ($notesEntries.Count -ne $slideEntries.Count) {
                    Add-Failure "The workshop deck has $($notesEntries.Count) notes pages for $($slideEntries.Count) slides."
                }
                foreach ($entry in $slideEntries) {
                    $reader = [System.IO.StreamReader]::new($entry.Open())
                    try { $xml = $reader.ReadToEnd() } finally { $reader.Dispose() }
                    [void]$deckXmlFragments.Add($xml)
                }
                foreach ($entry in $notesEntries) {
                    $reader = [System.IO.StreamReader]::new($entry.Open())
                    try { $xml = $reader.ReadToEnd() } finally { $reader.Dispose() }
                    [void]$deckXmlFragments.Add($xml)
                    if ($xml -notmatch '\[Sources\]') { Add-Failure "Deck notes entry $($entry.FullName) lacks a [Sources] block." }
                }
            } finally {
                $archive.Dispose()
            }
        } finally {
            $stream.Dispose()
        }
    } catch {
        Add-Failure "course/slides/Coding_Agent_Workshop.pptx is not a readable PPTX archive: $($_.Exception.Message)"
    }
}

# The website generator must expose the complete reviewed course-resource set.
$websiteGeneratorPath = Join-Path $repositoryRoot 'website/scripts/generate-course-data.mjs'
$websiteCheckPath = Join-Path $repositoryRoot 'website/scripts/check-course-data.mjs'
foreach ($path in @($websiteGeneratorPath, $websiteCheckPath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { Add-Failure "Missing $($path.Substring($repositoryRoot.Length + 1))." }
}
if (Test-Path -LiteralPath $websiteGeneratorPath -PathType Leaf) {
    $websiteGenerator = Get-Content -LiteralPath $websiteGeneratorPath -Raw
    $websiteResourcePaths = @(
        'LEARNER_PATH.md',
        'README.md',
        'CURRICULUM_INDEX.md',
        'sources/RESEARCH_INDEX.md',
        'LOGIC_REVIEW.md',
        'CHAPTER_IDEA_REVIEW.md',
        'WRAP_UP.md',
        'DELIVERY_GATES.md',
        'PLAN_COMPLETION_MATRIX.md',
        'PILOT.md',
        'assets/chapter_00/MODEL_SELECTION.md',
        'assets/chapter_00/LIVE_GATE_RUNBOOK.md'
    )
    foreach ($resourcePath in $websiteResourcePaths) {
        $needle = 'path: "' + $resourcePath + '"'
        if ($websiteGenerator.IndexOf($needle, [System.StringComparison]::Ordinal) -lt 0) {
            Add-Failure "website/scripts/generate-course-data.mjs does not expose course/$resourcePath as resource data."
        }
    }
}

# CI must prove the canonical project and every unique checkpoint state on all advertised platforms.
$courseWorkflowPath = Join-Path $repositoryRoot '.github/workflows/course-ci.yml'
if (-not (Test-Path -LiteralPath $courseWorkflowPath -PathType Leaf)) {
    Add-Failure 'Missing .github/workflows/course-ci.yml.'
} else {
    $courseWorkflow = Get-Content -LiteralPath $courseWorkflowPath -Raw
    foreach ($marker in @(
        'uses: actions/checkout@v6',
        'uses: actions/setup-node@v6',
        '- ubuntu-latest',
        '- windows-latest',
        '- macos-latest',
        'node course/scripts/checkpoints.mjs materialize all both',
        'Build ten unique checkpoint states',
        "Labels = @('checkpoint-00')",
        "Labels = @('checkpoint-05'); Tests = @('eval-E2')",
        "Labels = @('checkpoint-07', 'evaluation')",
        'PromptGate = $true',
        'Testing $($state.Name) label $label',
        'ctest --test-dir course/reference/build-ci -C Release --output-on-failure',
        'node course/scripts/run-evals.mjs --build-dir course/reference/build-ci'
    )) {
        if ($courseWorkflow.IndexOf($marker, [System.StringComparison]::Ordinal) -lt 0) {
            Add-Failure ".github/workflows/course-ci.yml lacks required cross-platform gate: $marker"
        }
    }
    $ciStateNames = @("'00_api_smoke-starter'") + @($checkpointIds | ForEach-Object { "'$_-solution'" })
    foreach ($stateName in $ciStateNames) {
        if ($courseWorkflow.IndexOf($stateName, [System.StringComparison]::Ordinal) -lt 0) {
            Add-Failure ".github/workflows/course-ci.yml does not build unique checkpoint state $stateName."
        }
    }
    if ([regex]::Matches($courseWorkflow, "Name = '[^']+'; Relative = '[^']+'", [System.Text.RegularExpressions.RegexOptions]::None).Count -ne 10) {
        Add-Failure '.github/workflows/course-ci.yml must declare exactly 10 unique checkpoint build states.'
    }
}

# Scan publishable text through multiple decoding passes for personal paths and plausible credential values.
function Get-DecodedVariants {
    param([Parameter(Mandatory)][string]$Content)
    $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    $frontier = [System.Collections.Generic.List[string]]::new()
    [void]$seen.Add($Content)
    [void]$frontier.Add($Content)
    for ($depth = 0; $depth -lt 3 -and $frontier.Count -gt 0; $depth += 1) {
        $next = [System.Collections.Generic.List[string]]::new()
        foreach ($current in $frontier) {
            $candidates = [System.Collections.Generic.List[string]]::new()
            [void]$candidates.Add([System.Net.WebUtility]::HtmlDecode($current))
            try { [void]$candidates.Add([System.Uri]::UnescapeDataString($current)) } catch { }
            [void]$candidates.Add($current.Replace('\\', '\').Replace('\/', '/'))
            try {
                $unicodeDecoded = [regex]::Replace($current, '\\u(?<hex>[0-9a-fA-F]{4})', {
                    param($match)
                    return [char][Convert]::ToInt32($match.Groups['hex'].Value, 16)
                })
                [void]$candidates.Add($unicodeDecoded)
            } catch { }
            foreach ($candidate in $candidates) {
                if ($seen.Add($candidate)) { [void]$next.Add($candidate) }
            }
            foreach ($match in [regex]::Matches($current, '(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{16,256}={0,2}(?![A-Za-z0-9+/=])')) {
                if (($match.Value.Length % 4) -ne 0) { continue }
                try {
                    $decoded = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($match.Value))
                    if ($decoded -match '(?i)(Users[\\/]|/home/|/Users/|sk-(?:or-)?|BEGIN [A-Z ]*PRIVATE KEY)') {
                        if ($seen.Add($decoded)) { [void]$next.Add($decoded) }
                    }
                } catch { }
            }
        }
        $frontier = $next
    }
    return @($seen)
}

$excludedDirectoryPattern = '(?i)(^|[\\/])(?:\.git|node_modules|dist|out|run|build[^\\/]*)([\\/]|$)|(?i)^website[\\/]src[\\/]generated[\\/]'
$textExtensions = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($extension in @('.md', '.txt', '.json', '.jsonl', '.js', '.mjs', '.cjs', '.html', '.css', '.yml', '.yaml', '.ps1', '.sh', '.cmake', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.ini', '.toml', '.xml')) {
    [void]$textExtensions.Add($extension)
}
$publishableTextFiles = @(Get-ChildItem -LiteralPath $repositoryRoot -Recurse -File | Where-Object {
    $_.FullName.Substring($repositoryRoot.Length + 1) -notmatch $excludedDirectoryPattern -and
    ($textExtensions.Contains($_.Extension) -or $_.Name -in @('CMakeLists.txt', 'Info.txt'))
})
$windowsUsersPattern = '(?i)[A-Z]:(?:\\|/)+Users(?:\\|/)+(?!you(?:\\|/)|user(?:name)?(?:\\|/)|student(?:\\|/)|instructor(?:\\|/))[^\\/\s"''<>|(){}\[\]?*]+(?:\\|/)'
$unixUsersPattern = '(?i)/(?:Users|home)/(?!you/|user(?:name)?/|student/|instructor/|runner/)[^/\s"''<>|(){}\[\]?*]+/'
$prefixedSecretPattern = '(?i)(?:(?<![A-Za-z0-9])sk-(?:or-v1-)?[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})'
$bearerSecretPattern = '(?i)Bearer\s+(?!<|\$|\{|\[|REDACTED\b|placeholder\b|example\b)[A-Za-z0-9._~+/-]{16,}'
$assignedSecretPattern = '(?i)(?:OPENROUTER_API_KEY|GITHUB_TOKEN|API_KEY|ACCESS_TOKEN)\s*[:=]\s*["'']?(?!<|\$|%|\*|redact|replace|your|example|dummy|placeholder|none|null)[A-Za-z0-9._~+/-]{16,}'
$privateKeyPattern = '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'

function Test-PublishableContent {
    param(
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][string]$Content
    )
    $variants = @(Get-DecodedVariants $Content)
    if (@($variants | Where-Object { $_ -match $windowsUsersPattern -or $_ -match $unixUsersPattern }).Count -gt 0) {
        Add-Failure "$Label contains a direct or recursively encoded personal absolute path."
    }
    if (@($variants | Where-Object {
        $_ -match $prefixedSecretPattern -or $_ -match $bearerSecretPattern -or
        $_ -match $assignedSecretPattern -or $_ -match $privateKeyPattern
    }).Count -gt 0) {
        Add-Failure "$Label contains a plausible direct or recursively encoded credential value."
    }
}

foreach ($file in $publishableTextFiles) {
    try { $content = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8 } catch { continue }
    $relative = $file.FullName.Substring($repositoryRoot.Length + 1).Replace('\', '/')
    Test-PublishableContent $relative $content
}
if ($deckXmlFragments.Count -gt 0) {
    Test-PublishableContent 'course/slides/Coding_Agent_Workshop.pptx text and notes' ($deckXmlFragments -join "`n")
}

if ($failures.Count -gt 0) {
    foreach ($failure in $failures) { Write-Host "::error::$failure" }
    Write-Host "Course material verification failed with $($failures.Count) issue(s)."
    exit 1
}

Write-Output 'Course material verification passed.'
Write-Output 'Verified 9 complete chapter packages, 70 authored slides, a 70-slide PPTX, 9 no-drift checkpoints with progressive release gates, 10-state cross-platform CI, 7 executable evals, chapter fixtures, failure traces, governance ledgers, website resources, and publishable-text hygiene.'
