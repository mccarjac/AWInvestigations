#!/bin/bash

# Comprehensive crash monitoring script for AWInvestigations app
# This script monitors for various types of crashes and errors

echo "🔍 Starting comprehensive crash monitoring for AWInvestigations..."
echo "=================================================="
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Clear previous logs
adb logcat -c

# Monitor multiple patterns simultaneously
adb logcat -v time \
  "*:E" \
  "ReactNativeJS:*" \
  "AndroidRuntime:E" \
  "FATAL:*" \
  "DEBUG:*" \
  "chromium:E" \
  "CrashHandler:*" \
  "art:E" \
  | grep --line-buffered -E "(FATAL|ReactNativeJS|AndroidRuntime|Error|Exception|Crash|gamecharactermanager|CharacterDetail)" \
  | while IFS= read -r line; do
      # Color code different error types
      if echo "$line" | grep -q "FATAL"; then
          echo -e "\033[1;31m[FATAL]\033[0m $line"
      elif echo "$line" | grep -q "ReactNativeJS"; then
          echo -e "\033[1;33m[JS]\033[0m $line"
      elif echo "$line" | grep -q "CharacterDetail"; then
          echo -e "\033[1;36m[DETAIL]\033[0m $line"
      elif echo "$line" | grep -q "Error"; then
          echo -e "\033[1;91m[ERROR]\033[0m $line"
      else
          echo "$line"
      fi
  done
