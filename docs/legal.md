# LinkDrop Legal, Abuse & Compliance Policy

## 1. Acceptable Use Policy (AUP)
All users and API clients must comply with the Acceptable Use Policy. The following activities are strictly prohibited:
- **Malware & Exploit Distribution**: Uploading, sharing, or linking to viruses, trojans, ransomware, or executable exploits.
- **Copyright Infringement**: Distributing copyrighted files, media, or proprietary software without explicit authorization.
- **Spam & Automated Bot Abuse**: Using automated scripts to bulk-upload or flood public share endpoints.

---

## 2. Mandatory Security & Scanning Policies
1. **Launch-Blocking Malware Scan**: All uploaded files across Cloud Relay and Share Links are scanned against virus definitions (`scanFile` / ClamAV) and file extension safety filters before link generation or S3 storage.
2. **IP Rate Limiting**: All public download and API endpoints enforce strict IP-based rate limiting (`express-rate-limit`) to prevent DDoS and automated scrapers.

---

## 3. DMCA & Abuse Takedown Procedure
LinkDrop maintains an immediate automated and manual takedown workflow:

```
[Public User / Copyright Owner] 
        │
        ▼
[POST /api/links/:id/report]
        │
        ▼
[Auto-Quarantine]: Deactivates link immediately (`active = false`)
        │
        ▼
[Admin Review]: Deletes file from storage upon confirmation
```

- **Reporting Endpoint**: `POST /api/links/:id/report`
- **Response Time**: Links reported for DMCA or abuse are automatically quarantined upon report receipt.
