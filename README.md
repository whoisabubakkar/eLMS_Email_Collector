# eLMS Email Collector

A lightweight Chrome extension for UIU eLMS (`elms.uiu.ac.bd`) that collects the email addresses of classmates in a specific course so you can send a single invite link (such as a WhatsApp group or study team link) without messaging everyone individually.

It only reads email addresses that users have explicitly made visible to enrolled course members on eLMS. Profiles with hidden email addresses are automatically skipped.

---

## Features

- **Single Course Extraction:** Select one enrolled course at a time to keep requests targeted and manageable.
- **Client-Side Only:** No database, no backend server, and zero external tracking. All data remains inside your browser.
- **Manual Override:** Enter a direct Moodle Course ID if the automated course list fails to fetch.
- **Flexible Export:** Copy raw email strings formatted for standard email client fields (`BCC`) or export a clean `.csv` spreadsheet.
- **Instructor Filtering:** Skips teachers and managers by default (can be included via toggle).

---

## Installation (Unpacked)

1. Download or clone this repository to your local machine.
2. Ensure the folder contains `manifest.json`, `popup.html`, and `popup.js`.
3. Navigate to `chrome://extensions` (or `edge://extensions` / `brave://extensions`).
4. Enable **Developer mode** using the toggle switch in the top-right corner.
5. Click **Load unpacked** and select your project folder.
6. Pin the extension to your browser toolbar for quick access.

---

## How to Use

1. Log in to UIU eLMS (`elms.uiu.ac.bd`) in your browser.
2. Click the **eLMS Email Collector** extension icon.
3. Select **one** course from the radio list (or enter a Course ID manually).
4. Click **Collect emails** and leave the popup open while it runs (~15 seconds for 40 participants).
5. Click **Copy emails** and paste the result into your email client.

> **Privacy Best Practice:** Always paste batch student email addresses into the **BCC** field rather than `To` or `CC` to protect peer email privacy.

---

## Privacy & Security

- **Strict Permissions:** Scoped exclusively to `https://elms.uiu.ac.bd/*`.
- **Zero Data Collection:** Does not collect, log, or transmit email addresses or session data to any external server or database.
- **Open Source:** Entirely contained in ~130 lines of readable JavaScript (`popup.js`).

---

## Responsible Use

- Use this tool strictly for academic collaboration, course announcements, or study groups.
- Do not publish, share, or redistribute collected email lists.
- Avoid running frequent or repetitive extractions to minimize request overhead on university servers.

---

## Technical Overview

- **Course Retrieval:** Requests `/my/courses.php` to extract the active Moodle `sesskey`, then queries `core_course_get_enrolled_courses_by_timeline_classification`.
- **Participant Parsing:** Parses `/user/index.php?id=<course_id>&perpage=5000` to extract participant profile links.
- **Email Decoding:** Resolves individual profile pages to decode percent-encoded Moodle `mailto:` strings.

---

## Limitations & Compatibility

- Target-built for UIU eLMS Moodle layout structure.
- Compatible with Chromium-based browsers (Chrome, Edge, Brave, Opera).
- Independent utility project; not officially affiliated with UIU or Moodle.

## License

This project is licensed under the [MIT License](LICENSE).
