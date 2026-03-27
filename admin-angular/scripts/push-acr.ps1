param(
    [string]$ImageName = 'admin-panel',
    [string]$Registry = 'lavanderiapro.azurecr.io',
    [string]$Tag = 'latest'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$remoteImage = "$Registry/$ImageName`:$Tag"
$localImage = "$ImageName`:$Tag"

Push-Location $projectRoot

try {
    Write-Host "Building $localImage from $projectRoot..."
    docker build -t $localImage .
    if ($LASTEXITCODE -ne 0) {
        throw "docker build failed with exit code $LASTEXITCODE"
    }

    Write-Host "Tagging $localImage as $remoteImage..."
    docker tag $localImage $remoteImage
    if ($LASTEXITCODE -ne 0) {
        throw "docker tag failed with exit code $LASTEXITCODE"
    }

    Write-Host "Pushing $remoteImage..."
    docker push $remoteImage
    if ($LASTEXITCODE -ne 0) {
        throw "docker push failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
