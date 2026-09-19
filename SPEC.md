# BrightSmile Dental — Demo Website with AI Receptionist

Build a **static, dependency-free demo website** for a fictional dental practice,
featuring an **AI agent receptionist chat widget**. Everything must run by simply
opening `index.html` in a browser — no build step, no npm, no server, no external
CDNs (fonts/system fonts only, inline SVG icons only).

## Design direction: clean, professional, reliable
- Medical/dental aesthetic: white background, deep teal (#0e7490 family) primary,
  soft slate text, generous whitespace, rounded cards, subtle shadows.
- Typography: system font stack (`-apple-system, Segoe UI, Roboto, sans-serif`),
  clear hierarchy, max 2 font weights per block.
- Fully responsive (mobile-first): navigation collapses to hamburger under 768px;
  chat widget works on small screens.
- Accessibility: semantic HTML5 landmarks, alt text, aria-labels on the chat
  widget, focus states, keyboard-usable chat input, color contrast AA.
- Subtle motion only: gentle fade-in on scroll (IntersectionObserver), smooth
  hover transitions. No janky animation loops.

## Page sections (single page, index.html)
1. **Sticky header**: logo (inline SVG tooth icon + "BrightSmile Dental"),
   nav links (Services, Why Us, Reviews, Contact), a "Book a Visit" button that
   opens the AI chat.
2. **Hero**: headline "Modern dentistry, gentle care.", subcopy, two CTAs
   ("Chat with Ava, our AI receptionist" → opens chat; "Book a Visit").
   Right side: a clean inline-SVG illustration of a smiling patient or abstract
   dental-care shapes (no external images). Small trust badges: "4.9★ from 2,300+
   patients", "Same-week appointments", "Insurance friendly".
3. **Services grid** (6 cards, inline SVG icons): Checkups & Cleanings,
   Teeth Whitening, Invisible Aligners, Dental Implants, Emergency Care,
   Pediatric Dentistry. Each card: icon, title, 1-line description, price hint
   ("from $99"), and a "Ask Ava about this" link that opens the chat with a
   prefilled question about that service.
4. **Why Us** (3 columns): transparent pricing, modern equipment, gentle
   anxiety-free approach.
5. **Reviews**: 3 testimonial cards with patient first name + star rating.
6. **Contact / hours**: address, phone, opening hours table (Mon–Sat, closed Sun),
   embedded-style map placeholder (styled div, no external iframe).
7. **Footer**: copyright, tiny disclaimer "Demo website — fictional practice".

## AI receptionist chat widget (the centerpiece)
A floating teal chat button (bottom-right, avatar with inline-SVG robot/sparkle
icon, subtle pulse until first open). Click opens a chat panel (360px wide
desktop / full-width bottom sheet mobile, ~520px tall, rounded corners, shadow).

**Persona**: "Ava — AI receptionist at BrightSmile Dental". Warm, concise,
professional. Message bubbles: agent left (light teal), user right (teal).

**Conversation behavior (all client-side, no APIs):**
- Typing indicator (3 bouncing dots) before each agent reply, 600–1200ms delay.
- Welcome message on first open + quick-reply chips: "Book an appointment",
  "Opening hours", "Prices", "Do you take my insurance?", "Emergency".
- A small **intent engine** in `chat.js`:
  - `greeting` intent (hi/hello/hey) → warm greeting.
  - `hours` intent → reads hours from a HOURS constant.
  - `prices` intent → lists price ranges by service; follow-up service mentions
    (e.g. "whitening") give that service's price.
  - `insurance` intent → "We're in-network with Delta Dental, Cigna, Aetna and
    most PPO plans — bring your card and we'll verify in 2 minutes."
  - `emergency` intent → empathetic urgent reply + "earliest slot today 4:30 PM,
    shall I book it?" that starts booking flow.
  - `location`/`parking` intent → address + free parking note.
  - `services` intent or service keyword → short description of that service.
  - `book` intent (also triggered by "Book a Visit" buttons) → **booking flow**:
    asks for (1) patient name, (2) phone, (3) service (chips), (4) preferred
    date+time (free text, accept natural phrases like "friday morning" → offer
    concrete nearest slots), then shows a **confirmation summary card** inside
    chat (name, service, date/time, clinic address) with Confirm / Change
    buttons. On confirm: success message with a fake booking reference
    (e.g. `BS-4F7K2`) and "Add a reminder" note. Validate phone loosely
    (≥7 digits), re-ask politely on invalid input.
  - `human` intent ("talk to a person") → offers callback: takes number,
    says a human will call within 30 minutes.
  - fallback → polite "I can help with appointments, prices, insurance, hours
    or emergencies — what would you like to know?" Never hallucinate dental
    medical advice; if asked clinical questions ("does this hurt?") reply that
    Dr. Lee will advise at the visit and offer to book.
- Maintain conversation state (awaiting name / phone / service / datetime /
  confirm) in a state machine — chips and free text both feed it.
- Chat panel has header (Ava avatar, name, "Online • replies instantly" with
  green dot, minimize button), scrollable message list, quick chips row that
  reappears contextually, and input with send button. Enter sends; Shift+Enter
  newline. Auto-scroll to latest message.
- A small "AI assistant — demo" label in the header for honesty.

## Files
- `index.html` — all sections, semantic and accessible.
- `css/styles.css` — all styling, CSS custom properties for the palette.
- `js/chat.js` — chat widget + intent engine + booking state machine (clean,
  commented, no globals leaked beyond one `AvaChat` init).
- `js/main.js` — nav toggle, smooth scroll, scroll fade-ins, "Book a Visit"
  buttons wired to chat.
- `README.md` — what it is, how to run (open index.html), feature list, and a
  short "where the real AI backend would plug in" note.

## Quality bar
- No console errors. Valid semantic HTML. Works in Chrome/Edge/Firefox.
- All strings for the clinic (name, hours, prices, address) as named constants
  at the top of `chat.js` so they're easy to change.
- Test the booking flow end-to-end mentally; every state must be reachable.
- Commit everything to git with message "feat: BrightSmile Dental demo site with Ava AI receptionist".
