$ErrorActionPreference = 'Stop'
$root = 'f:\Water Guardian System'
$partsDir = Join-Path $root 'assets\css\_parts'
$cssDir   = Join-Path $root 'assets\css'

# Part-file -> target-file map (ordered)
$map = [ordered]@{
    'tokens.css'    = @('01-tokens.css','02-base.css')
    'components.css' = @('03-buttons.css','04-forms.css','05-checkbox.css',
                         '06-cards.css','07-widgets.css')
    'auth.css'      = @('08-auth-brand.css','09-auth-hero.css','10-auth-form.css')
    'app.css'       = @('11-app-shell.css','12-app-topbar.css','13-stats.css',
                        '14-zone-table.css','15-dashboard-widgets.css')
}

foreach ($target in $map.Keys) {
    $out = Join-Path $cssDir $target
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine("/* --------------------------------------------------------------------------")
    [void]$sb.AppendLine("   Smart Water Guardian - $target")
    [void]$sb.AppendLine("   GENERATED FILE - edit the sources in assets/css/_parts/ instead,")
    [void]$sb.AppendLine("   then run: powershell -File assets/css/_build.ps1")
    [void]$sb.AppendLine("   -------------------------------------------------------------------------- */")
    [void]$sb.AppendLine("")

    foreach ($p in $map[$target]) {
        $src = Join-Path $partsDir $p
        if (-not (Test-Path -LiteralPath $src)) { throw "Missing part: $p" }
        [void]$sb.AppendLine((Get-Content -LiteralPath $src -Raw))
        [void]$sb.AppendLine("")
    }

    [System.IO.File]::WriteAllText($out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ("built {0,-16} from {1} parts" -f $target, $map[$target].Count)
}

# ---------- validate every generated file ----------
$report = New-Object System.Collections.Generic.List[string]
$report.Add("=== CSS BUILD VALIDATION ===")

Get-ChildItem -LiteralPath $cssDir -Filter '*.css' | ForEach-Object {
    $t = Get-Content -LiteralPath $_.FullName -Raw
    $o = ([regex]::Matches($t,'\{')).Count
    $c = ([regex]::Matches($t,'\}')).Count

    # Walk the file tracking nesting depth. A "stray" is a closer seen while
    # depth is already 0 (i.e. a rule was never opened).
    $depth = 0
    $stray = 0
    $rules = 0
    $raw = Get-Content -LiteralPath $_.FullName
    for ($i=0; $i -lt $raw.Count; $i++) {
        $code = $raw[$i]
        # strip block comments
        $code = [regex]::Replace($code, '/\*.*?\*/', '', 'Singleline')
        # strip string literals so braces inside url("...") are ignored
        $code = [regex]::Replace($code, '"[^"]*"', '""')

        $opens = ([regex]::Matches($code,'\{')).Count
        $closes = ([regex]::Matches($code,'\}')).Count

        if ($depth -eq 0) {
            if ($opens -gt 0) { $rules++ }
            elseif ($closes -gt 0) { $stray++ }
        }

        $depth += $opens - $closes
        if ($depth -lt 0) { $depth = 0 }
    }

    $status = if ($o -eq $c -and $stray -eq 0 -and $depth -eq 0) { 'OK' } else { '*** PROBLEM ***' }
    $report.Add(("  {0,-16} braces {1}/{2}  rules {3,-4} stray {4,-3} endDepth {5,-3} {6}" -f $_.Name,$o,$c,$rules,$stray,$depth,$status))
}

$report | Out-File -LiteralPath (Join-Path $root '_cssbuild.txt') -Encoding utf8
Write-Host "build + validation done"
