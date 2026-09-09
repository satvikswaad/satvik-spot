#!/usr/bin/env bash
# ==============================================================================
# OWASP ZAP Baseline Security Scan Script (Linux / macOS / CI Runner)
# Satvik Swaad Quality & Security Engineering
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_URL="${1:-${TARGET_URL:-http://localhost:5000}}"
REPORT_DIR="${REPORT_DIR:-${SCRIPT_DIR}/reports}"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/zap-baseline.conf}"
BEARER_TOKEN="${BEARER_TOKEN:-}"
DOCKER_IMAGE="${DOCKER_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"
FAIL_ON_WARN="${FAIL_ON_WARN:-false}"

echo "=========================================================="
echo "   OWASP ZAP Baseline Security Scanner (Satvik Swaad)    "
echo "=========================================================="

# 1. Verify Docker Availability
if ! command -v docker &> /dev/null; then
  echo "[-] ERROR: Docker executable not found in PATH." >&2
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "[-] ERROR: Docker daemon is not accessible or not running." >&2
  exit 1
fi

# 2. Verify Config File & Create Report Directory
if [[ ! -f "${CONFIG_FILE}" ]]; then
  echo "[-] ERROR: Configuration file not found at: ${CONFIG_FILE}" >&2
  exit 1
fi

mkdir -p "${REPORT_DIR}"
ABS_REPORT_DIR="$(cd "${REPORT_DIR}" && pwd)"
ABS_CONFIG_DIR="$(cd "$(dirname "${CONFIG_FILE}")" && pwd)"
CONFIG_FILENAME="$(basename "${CONFIG_FILE}")"

echo "Target URL:       ${TARGET_URL}"
echo "Docker Image:     ${DOCKER_IMAGE}"
echo "Config File:      ${CONFIG_FILE}"
echo "Report Directory: ${ABS_REPORT_DIR}"
echo "----------------------------------------------------------"

# 3. Handle Localhost Target Routing in Container
TARGET_HOST_URL="${TARGET_URL}"
DOCKER_NETWORK_ARGS=()

if [[ "${TARGET_URL}" =~ localhost|127\.0\.0\.1 ]]; then
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    DOCKER_NETWORK_ARGS+=("--network=host")
    echo "[i] Using host networking for local Linux scan."
  else
    TARGET_HOST_URL="${TARGET_HOST_URL//localhost/host.docker.internal}"
    TARGET_HOST_URL="${TARGET_HOST_URL//127.0.0.1/host.docker.internal}"
    echo "[i] Rewrote localhost to host.docker.internal for container access."
  fi
fi

# 4. Handle Optional Bearer Token Authentication
EXTRA_ZAP_ARGS=()
if [[ -n "${BEARER_TOKEN}" ]]; then
  AUTH_CONFIG="replacer.full_list(0).description=auth&replacer.full_list(0).enabled=true&replacer.full_list(0).matchtype=REQ_HEADER&replacer.full_list(0).matchstr=Authorization&replacer.full_list(0).regex=false&replacer.full_list(0).replacement=Bearer ${BEARER_TOKEN}"
  EXTRA_ZAP_ARGS+=("-z" "-config" "${AUTH_CONFIG}")
  echo "[i] Injected Bearer authorization token into scan profile."
fi

# 5. Execute Docker Baseline Scan
echo "[+] Launching OWASP ZAP container..."
set +e
docker run --rm \
  "${DOCKER_NETWORK_ARGS[@]}" \
  -u "$(id -u):$(id -g)" \
  -v "${ABS_CONFIG_DIR}:/zap/conf:ro" \
  -v "${ABS_REPORT_DIR}:/zap/wrk:rw" \
  "${DOCKER_IMAGE}" \
  zap-baseline.py \
  -t "${TARGET_HOST_URL}" \
  -c "/zap/conf/${CONFIG_FILENAME}" \
  -r "zap-report.html" \
  -J "zap-report.json" \
  -w "zap-report.md" \
  "${EXTRA_ZAP_ARGS[@]}"

SCAN_EXIT_CODE=$?
set -e

echo "----------------------------------------------------------"
echo "[+] Scan completed with exit code: ${SCAN_EXIT_CODE}"

# ZAP Baseline Exit Codes:
# 0 = All tests passed
# 1 = At least one FAIL rule triggered
# 2 = At least one WARN rule triggered
# 3 = Other failure / unreachable target

case "${SCAN_EXIT_CODE}" in
  0)
    echo "SUCCESS: Zero security rule violations detected."
    exit 0
    ;;
  1)
    echo "CRITICAL FAILURE: OWASP ZAP baseline scan detected security policy violations."
    echo "Review detailed HTML report: ${ABS_REPORT_DIR}/zap-report.html"
    exit 1
    ;;
  2)
    if [[ "${FAIL_ON_WARN}" == "true" ]]; then
      echo "WARNING FAILURE: Warnings detected and FAIL_ON_WARN is true."
      exit 1
    else
      echo "PASSED WITH WARNINGS: Review warning entries in ${ABS_REPORT_DIR}/zap-report.html"
      exit 0
    fi
    ;;
  *)
    echo "ERROR: Scan execution failed or target was unreachable (Code: ${SCAN_EXIT_CODE})."
    exit "${SCAN_EXIT_CODE}"
    ;;
esac
