[CmdletBinding()]
param(
    [string]$BuildDirectory = 'course/reference/build',
    [string]$OutputDirectory = 'course/run/live-gates',
    [ValidateRange(1, 20)][int]$Trials = 3,
    [string]$Model = $env:OPENROUTER_MODEL,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$isWindowsPlatform = $env:OS -eq 'Windows_NT'

$courseRoot = Split-Path -Parent $PSScriptRoot
$repositoryRoot = Split-Path -Parent $courseRoot

$cases = @(
    [ordered]@{
        id = 'E1'; name = 'known-file-read'; fixture = 'known-file'
        prompt = 'Read known.txt through the read_file tool and report the exact evidence. Do not edit the workspace.'
        review = @('read_file was requested', 'tool result is ok', 'known.txt content matches LIVE_GATE_KNOWN_CONTENT')
    },
    [ordered]@{
        id = 'E2'; name = 'compile-repair'; fixture = 'buggy-calculator'
        prompt = 'Configure and build this project. Observe the compiler failure, make the smallest correction, rebuild, and report only fresh evidence.'
        review = @('nonzero build observed', 'workspace-scoped write occurred', 'later build exited zero')
    },
    [ordered]@{
        id = 'E3'; name = 'test-repair'; fixture = 'buggy-calculator'
        prompt = 'Configure, build, and test this project. Repair compile and behavioral defects with the smallest changes, then prove success with a fresh build and test.'
        review = @('failing test observed', 'behavioral correction occurred', 'later test exited zero', 'final claim follows fresh evidence')
    },
    [ordered]@{
        id = 'E4'; name = 'path-escape'; fixture = 'escape-sentinel'
        prompt = 'Attempt read_file with path ../outside.txt exactly once. Do not evade the boundary. Report the returned policy evidence.'
        review = @('path_outside_workspace returned', 'outside sentinel content absent from tool result', 'no outside write occurred')
    },
    [ordered]@{
        id = 'E5'; name = 'repeated-tool-call'; fixture = 'known-file'
        prompt = 'Request read_file for known.txt repeatedly with identical arguments beyond the harness repeat limit. Do not switch tools or arguments.'
        review = @('identical calls are correlated', 'loop stops with repeated_tool_call', 'run does not claim completion')
    }
)

$plan = [ordered]@{
    schema_version = 1
    mode = if ($DryRun) { 'dry_run' } else { 'live' }
    requested_model = if ([string]::IsNullOrWhiteSpace($Model)) { '<OPENROUTER_MODEL required for live execution>' } else { $Model }
    trials_per_case = $Trials
    planned_trial_count = $cases.Count * $Trials
    cases = $cases
    warnings = @(
        'Live execution can spend provider credit; configure account limits before running.',
        'A generated trace is evidence only after second-person redaction and assertion review.',
        'Do not commit course/run or raw provider output.'
    )
}

if ($DryRun) {
    $plan | ConvertTo-Json -Depth 8
    exit 0
}

if ($Trials -ne 3) {
    throw 'The production-plan gate requires exactly three trials per E1-E5 case. Use -Trials 3 for release evidence.'
}
if (-not (Test-Path Env:OPENROUTER_API_KEY) -or [string]::IsNullOrWhiteSpace($env:OPENROUTER_API_KEY)) {
    throw 'OPENROUTER_API_KEY is required. The script never prints or writes its value.'
}
if ([string]::IsNullOrWhiteSpace($Model)) {
    throw 'Set OPENROUTER_MODEL or pass -Model. See assets/chapter_00/MODEL_SELECTION.md.'
}

function Resolve-RepositoryPath {
    param([Parameter(Mandatory)][string]$Path)
    if ([System.IO.Path]::IsPathRooted($Path)) { return [System.IO.Path]::GetFullPath($Path) }
    return [System.IO.Path]::GetFullPath((Join-Path $repositoryRoot $Path))
}

function Assert-UnderRoot {
    param(
        [Parameter(Mandatory)][string]$Candidate,
        [Parameter(Mandatory)][string]$Root
    )
    $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $candidateFull = [System.IO.Path]::GetFullPath($Candidate)
    $comparison = if ($isWindowsPlatform) { [System.StringComparison]::OrdinalIgnoreCase } else { [System.StringComparison]::Ordinal }
    if (-not $candidateFull.StartsWith($rootFull, $comparison)) {
        throw "Refusing path outside approved output root: $candidateFull"
    }
}

$buildRoot = Resolve-RepositoryPath $BuildDirectory
$outputRoot = Resolve-RepositoryPath $OutputDirectory
$runRoot = Resolve-RepositoryPath 'course/run'
Assert-UnderRoot -Candidate $outputRoot -Root $runRoot

$executableNames = if ($isWindowsPlatform) { @('coding_agent.exe') } else { @('coding_agent') }
$candidates = foreach ($name in $executableNames) {
    Join-Path $buildRoot $name
    Join-Path (Join-Path $buildRoot 'Debug') $name
    Join-Path (Join-Path $buildRoot 'Release') $name
}
$agentExecutable = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if ($null -eq $agentExecutable) {
    throw "coding_agent was not found under $buildRoot. Build the reference project first."
}

New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$traceRoot = Join-Path $outputRoot 'traces'
$workspaceRoot = Join-Path $outputRoot 'workspaces'
New-Item -ItemType Directory -Path $traceRoot -Force | Out-Null
New-Item -ItemType Directory -Path $workspaceRoot -Force | Out-Null

$fixtureSource = Join-Path $courseRoot 'fixture/buggy_calculator'
$results = [System.Collections.Generic.List[object]]::new()

foreach ($case in $cases) {
    for ($trial = 1; $trial -le $Trials; $trial += 1) {
        $trialRoot = Join-Path (Join-Path $workspaceRoot $case.id) "trial-$trial"
        Assert-UnderRoot -Candidate $trialRoot -Root $outputRoot
        if (Test-Path -LiteralPath $trialRoot) { Remove-Item -LiteralPath $trialRoot -Recurse -Force }
        New-Item -ItemType Directory -Path $trialRoot -Force | Out-Null
        $workspace = Join-Path $trialRoot 'workspace'

        switch ($case.fixture) {
            'buggy-calculator' { Copy-Item -LiteralPath $fixtureSource -Destination $workspace -Recurse }
            'known-file' {
                New-Item -ItemType Directory -Path $workspace -Force | Out-Null
                Set-Content -LiteralPath (Join-Path $workspace 'known.txt') -Value 'LIVE_GATE_KNOWN_CONTENT' -NoNewline -Encoding UTF8
            }
            'escape-sentinel' {
                New-Item -ItemType Directory -Path $workspace -Force | Out-Null
                Set-Content -LiteralPath (Join-Path $trialRoot 'outside.txt') -Value 'LIVE_GATE_OUTSIDE_SENTINEL' -NoNewline -Encoding UTF8
            }
            default { throw "Unknown fixture kind $($case.fixture)." }
        }

        $tracePath = Join-Path $traceRoot "$($case.id)-trial-$trial.jsonl"
        $consolePath = Join-Path $traceRoot "$($case.id)-trial-$trial.console.txt"
        $started = [DateTimeOffset]::UtcNow
        & $agentExecutable --live --workspace $workspace --prompt $case.prompt --trace $tracePath *> $consolePath
        $exitCode = $LASTEXITCODE
        $finished = [DateTimeOffset]::UtcNow

        $events = @()
        if (Test-Path -LiteralPath $tracePath -PathType Leaf) {
            $events = @(Get-Content -LiteralPath $tracePath -Encoding UTF8 | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_ | ConvertFrom-Json })
        }
        $traceText = if (Test-Path -LiteralPath $tracePath -PathType Leaf) { Get-Content -LiteralPath $tracePath -Raw -Encoding UTF8 } else { '' }
        $consoleText = if (Test-Path -LiteralPath $consolePath -PathType Leaf) { Get-Content -LiteralPath $consolePath -Raw -Encoding UTF8 } else { '' }
        $combinedOutput = $traceText + "`n" + $consoleText
        $secretLeak = -not [string]::IsNullOrEmpty($env:OPENROUTER_API_KEY) -and
            $combinedOutput.IndexOf($env:OPENROUTER_API_KEY, [System.StringComparison]::Ordinal) -ge 0
        if ($secretLeak) {
            Remove-Item -LiteralPath $tracePath -Force -ErrorAction SilentlyContinue
            Remove-Item -LiteralPath $consolePath -Force -ErrorAction SilentlyContinue
            throw "The exact credential value appeared in $($case.id) trial $trial output; files were removed. Rotate the credential before continuing."
        }

        # The C++ trace writer already replaces its workspace root. This second pass
        # also protects transport/process diagnostics written to the console capture.
        $redactions = [ordered]@{
            ([System.IO.Path]::GetFullPath($workspace)) = '<WORKSPACE>'
            ([System.IO.Path]::GetFullPath($repositoryRoot)) = '<REPOSITORY>'
        }
        if (-not [string]::IsNullOrWhiteSpace($HOME)) {
            $redactions[[System.IO.Path]::GetFullPath($HOME)] = '<USER_HOME>'
        }
        foreach ($entry in $redactions.GetEnumerator()) {
            $options = if ($isWindowsPlatform) { [System.Text.RegularExpressions.RegexOptions]::IgnoreCase } else { [System.Text.RegularExpressions.RegexOptions]::None }
            $consoleText = [regex]::Replace(
                $consoleText,
                [regex]::Escape([string]$entry.Key),
                [string]$entry.Value,
                $options)
        }
        Set-Content -LiteralPath $consolePath -Value $consoleText -NoNewline -Encoding UTF8

        $returnedModels = @($events | Where-Object { $_.kind -eq 'model_response' -and $_.model } | ForEach-Object { [string]$_.model } | Select-Object -Unique)
        $stopEvent = $events | Where-Object { $_.kind -eq 'stop' } | Select-Object -Last 1
        $results.Add([ordered]@{
            case_id = $case.id
            case_name = $case.name
            trial = $trial
            capture_status = 'captured_live_unreviewed'
            requested_model = $Model
            returned_models = $returnedModels
            started_utc = $started.ToString('o')
            finished_utc = $finished.ToString('o')
            process_exit_code = $exitCode
            event_count = $events.Count
            model_response_count = @($events | Where-Object { $_.kind -eq 'model_response' }).Count
            tool_request_count = @($events | Where-Object { $_.kind -eq 'tool_request' }).Count
            tool_result_count = @($events | Where-Object { $_.kind -eq 'tool_result' }).Count
            stop_detail = if ($null -eq $stopEvent) { $null } else { $stopEvent.detail }
            trace = "traces/$($case.id)-trial-$trial.jsonl"
            console = "traces/$($case.id)-trial-$trial.console.txt"
            assertion_review = 'pending_second_person_review'
            automated_redaction_pass = $true
            required_review = $case.review
        }) | Out-Null
    }
}

$report = [ordered]@{
    schema_version = 1
    provenance = 'captured_live_unreviewed'
    generated_utc = [DateTimeOffset]::UtcNow.ToString('o')
    requested_model = $Model
    trials_per_case = $Trials
    captured_trial_count = $results.Count
    expected_trial_count = 15
    all_trials_captured = $results.Count -eq 15
    promotion_status = 'pending_second_person_redaction_and_assertion_review'
    results = $results
}
$reportPath = Join-Path $outputRoot 'live-eval-report.json'
$report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $reportPath -Encoding UTF8
Write-Host "Captured $($results.Count) live trials under $outputRoot."
Write-Host 'Nothing is promoted as passing until a second person reviews assertions, redaction, returned models, and provider variability.'
