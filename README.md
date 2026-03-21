# My Website - Everything at one place

## Add new Blog:
1. Create folder: `content/blogs/my-blog-name/`
2. Create `content/blogs/my-blog-name/index.md with`:
```markdown
---
title = "Blog Title"
date = 2026-03-21
draft = false
tags = []
categories = []
toc = true
description = "Brief description"
image = "cover.jpg"
---

markdown content here...
```
3. Add assets folder: `content/blogs/my-blog-name/assets/`


## Add new Project:

1. Open `data/projects.toml`
2. Add project details in this template:

```toml
[[projects]]
weight = 10
title = "PacketScope"
tagline = "Network traffic analyzer for protocol-level debugging"
status = "Production"
year = "2025"
role = "Full-Stack Engineer"
team = "Solo"
description = "Built a traffic observability tool for parsing HTTP, DNS, and TLS handshake metadata with real-time filtering and session replay views."
github = "https://github.com/example/packetscope"
demo = "https://packetscope-demo.example.com"
blog = "/blogs/digit-recognition-analysis/"

tech = ["Go", "WebSockets", "PostgreSQL", "Docker"]
tools = ["Wireshark", "Grafana", "GitHub Actions", "Nginx"]
highlights = [
  "Live packet stream filtering under 30ms",
  "Replay timeline with protocol-specific event markers",
  "Exportable session reports for incident reviews"
]
```
