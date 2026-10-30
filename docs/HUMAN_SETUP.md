# Human Setup Instructions

This document lists steps that must be performed by a human, usually involving secrets or sensitive accounts. **Never commit secrets to this repository.**

## Android Setup
To produce signed releases, you need to set up a Keystore and provide secrets to GitHub Actions.

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore formulaflash.keystore -alias formulaflash -keyalg RSA -keysize 2048 -validity 10000
   ```
2. In your GitHub repository settings under **Secrets and variables > Actions**, add the following repository secrets:
   - `ANDROID_KEYSTORE_BASE64` (Base64 representation of the formulaflash.keystore file)
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`
