# JWT Token Analysis

The OpenRouteService API key you provided appears to be a JWT token:
```
eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjUzMDc4OGI2NGQ2ZTRjYzdiNDU4YTA1M2U2ZDE0MzFlIiwiaCI6Im11cm11cjY0In0=
```

## Decoded JWT Payload:
```json
{
  "org": "5b3ce3597851110001cf6248",
  "id": "530788b64d6e4cc7b458a053e6d1431e",
  "h": "murmur64"
}
```

## Analysis:
This JWT token contains:
- **org**: Organization ID (5b3ce3597851110001cf6248)
- **id**: API Key ID (530788b64d6e4cc7b458a053e6d1431e)
- **h**: Hash algorithm (murmur64)

## Issue:
This appears to be a **JWT token** rather than a direct API key. OpenRouteService typically expects a simple API key string, not a JWT token.

## Solutions:

### Option 1: Get the Real API Key
You need to extract the actual API key from your OpenRouteService account. The JWT token is likely used for authentication, but the actual API key should be a simple string.

### Option 2: Try Different Authorization Format
Some services expect JWT tokens in a different format. Let me try different approaches.

### Option 3: Check OpenRouteService Documentation
The JWT format suggests this might be from a newer version of the API or a different service.

## Next Steps:
1. **Check your OpenRouteService dashboard** for the actual API key
2. **Try the "Test ORS API" button** I added to see detailed error information
3. **Look for a simple string API key** in your OpenRouteService account settings

## Expected API Key Format:
OpenRouteService API keys are typically simple strings like:
- `5b3ce3597851110001cf6248` (organization ID)
- Or a longer string without dots

## Current Status:
The system is trying to use the JWT token as an API key, which is causing the 400 Bad Request error.
