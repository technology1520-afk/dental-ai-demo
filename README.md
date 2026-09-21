# BrightSmile Dental

[![Live demo](https://img.shields.io/badge/live%20demo-BrightSmile%20Dental-0e7490?style=flat-square)](https://technology1520-afk.github.io/dental-ai-demo/)

A static, dependency-free demo for a fictional dental practice, featuring Ava, a simulated AI receptionist. All artwork is inline SVG and all fonts are system fonts. No APIs, CDNs, dependencies, build tools, or server are needed.

**[Open the live demo →](https://technology1520-afk.github.io/dental-ai-demo/)**

## Run

Open `index.html` directly in a current Chrome, Edge, or Firefox browser. Keep the `css` and `js` folders alongside it. JavaScript must be enabled for the chat and mobile navigation.

## Features

- Responsive single-page design: sticky header, mobile navigation, six services, care philosophy, testimonials, contact details, hours, and an illustrative map.
- Accessible landmarks, keyboard focus states, reduced-motion support, gentle scroll reveals, and a chat conversation announced through a live region.
- Ava chat with delayed typing indicators, contextual quick replies, greetings, hours, service descriptions, price ranges, insurance, location, parking, emergencies, and callback simulation.
- Booking state machine: name → phone → service → date preference → concrete slot → confirmation card → fake booking reference. Confirm or change individual details; type `Cancel` or `Start over` to reset.
- Loose phone validation (at least seven digits). Slots use Austin local time, exclude Sundays and elapsed regular slots, and support preferences such as `Friday morning`, `tomorrow at 2 PM`, and `2026-10-01`. Unrecognized preferences produce the nearest available demo choices for explicit selection.
- Emergency flow offers the spec’s fixed simulated “today at 4:30 PM” slot, regardless of the real time or opening hours. This is clearly labeled as a scenario, not live availability.
- Service buttons prefill an editable question. Enter sends; Shift+Enter adds a newline. Escape minimizes chat and restores focus. Closing and reopening retains the current conversation until the page reloads.

## Files and customization

- `index.html`: static page and chat markup.
- `css/styles.css`: palette variables, responsive layout, motion, and chat styles.
- `js/chat.js`: named clinic, hours, price, and service constants at the top; intent routing and booking state. The only exported global is `AvaChat`, whose `init()` method returns the widget API.
- `js/main.js`: navigation, scrolling, reveals, and chat entry points.

Edit the constants in `js/chat.js` to customize Ava’s clinic information. Update the corresponding static text in `index.html` to match. Prices, reviews, patient counts, contact details, bookings, and callbacks are fictional. Messages are kept only in page memory: nothing is sent or persisted. Use sample patient details. Ava does not give medical advice and directs clinical questions to Dr. Lee.

## Validation

Check JavaScript syntax with Node (only needed for development, not to run the site):

```sh
node --check js/chat.js
node --check js/main.js
```

Exercise the booking: open **Book a Visit**, enter a sample name, try an invalid phone, then `5125550123`, choose a service, enter `Friday morning`, choose a concrete slot, change a detail, and confirm. Check the fake `BS-` reference. Also try prices followed by `whitening`, hours, insurance, location, an emergency booking, a callback with invalid/valid numbers, cancellation, and a clinical question such as `Does this hurt?`.

## Where a real AI backend would plug in

`handle()` in `js/chat.js` is the routing boundary for user messages; `reply()` renders the response. A production version could send messages from this boundary to a server endpoint for AI responses, with appointment and callback actions handled by authenticated server-side tools. Keep API keys on that server. Replace `nearestSlots()` and fake confirmation with actual scheduling availability and a server-confirmed booking before claiming success. Real patient data needs appropriate consent, access controls, and retention policies; this demo intentionally has no backend or storage.
