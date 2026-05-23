##FixTok

I kept exporting videos from TikTok and the audio was always delayed ( ~133ms delay from TikTok's export). Instead of fixing every video manually, I built a browser tool that does it in seconds. FFmpeg runs directly in the browser.

Backstory: I used to fix my videos in the mac terminal but after trying to to explain it to a friend I thought it's better too develop a user friendly online-tool.

**Learned:** FFmpeg, Next.js


##Features I added:

- drop a whole folder, it scans automatically
- Saves next to originals. No Downloads folder mess
- Blog Post for google SEO
- user friendly interface

##Tech stack

- Next.js 14 · React 18 · TypeScript
- `@ffmpeg/ffmpeg` + `@ffmpeg/core` (WebAssembly)



