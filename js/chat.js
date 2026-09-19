/* Ava is a local demo: no requests, storage, or real appointments. */
(() => {
  'use strict';

  // Clinic content: keep these constants aligned with the static page when editing.
  const CLINIC_NAME = 'BrightSmile Dental';
  const CLINIC_ADDRESS = '123 Smile Avenue, Suite 100, Austin, TX 78701';
  const CLINIC_PHONE = '(512) 555-0148';
  const CLINIC_TIMEZONE = 'America/Chicago';
  const HOURS = Object.freeze({ weekdays: 'Monday–Friday: 8:00 AM–6:00 PM', saturday: 'Saturday: 9:00 AM–2:00 PM', sunday: 'Sunday: closed' });
  const PRICES = Object.freeze({ checkups: '$99–$180', whitening: '$199–$450', aligners: '$2,500–$5,500', implants: '$1,500–$3,500 per implant', emergency: '$150–$300 for an assessment', pediatric: '$79–$150' });
  const SERVICES = Object.freeze({
    checkups: { name: 'Checkups & Cleanings', description: 'A routine exam and professional cleaning to help keep your smile healthy.', keywords: /checkup|check.up|cleaning|clean teeth|exam/ },
    whitening: { name: 'Teeth Whitening', description: 'Professional whitening options with a plan personalized by your dentist.', keywords: /whiten|bleach/ },
    aligners: { name: 'Invisible Aligners', description: 'Discreet clear aligners, with a consultation to explore your options.', keywords: /aligner|invisalign|braces|straighten/ },
    implants: { name: 'Dental Implants', description: 'A consultation to explore personalized tooth replacement options.', keywords: /implant|missing tooth|replacement/ },
    emergency: { name: 'Emergency Care', description: 'An urgent dental assessment with time set aside for unexpected concerns.', keywords: /emergen|urgent|toothache|broken tooth|swelling|bleeding/ },
    pediatric: { name: 'Pediatric Dentistry', description: 'Gentle checkups and friendly dental care for children.', keywords: /pediatric|child|kid|daughter|son\b/ }
  });
  const INSURANCE = "We're in-network with Delta Dental, Cigna, Aetna and most PPO plans — bring your card and we'll verify in 2 minutes.";
  const WELCOME_CHIPS = ['Book an appointment', 'Opening hours', 'Prices', 'Do you take my insurance?', 'Emergency'];
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const CLINICAL = /\b(hurt|painful|safe|diagnos\w*|treat\w*|medicine|medication|antibiotic|dose|symptom\w*|cavity|cavities|infect\w*|pregnan\w*|should i|is it normal)\b/;

  function serviceFor(text) {
    return Object.keys(SERVICES).find(key => SERVICES[key].keywords.test(text.toLowerCase()));
  }

  function intentFor(text) {
    const value = text.toLowerCase();
    if (/^tell me about\b/.test(value) && serviceFor(value)) return 'services';
    if (/\b(emergency|urgent|toothache|swelling|bleeding)\b|broken tooth/.test(value)) return 'emergency';
    if (CLINICAL.test(value)) return 'clinical';
    if (/\b(human|person|receptionist|callback|call me)\b/.test(value)) return 'human';
    if (/\b(book|booking|appointment|schedule|visit)\b/.test(value)) return 'book';
    if (/\b(hour|hours|open|opening|close|closed)\b/.test(value)) return 'hours';
    if (/\b(insurance|ppo|delta|cigna|aetna|coverage)\b/.test(value)) return 'insurance';
    if (/\b(price|prices|cost|costs|fee|fees|expensive)\b|how much/.test(value)) return 'prices';
    if (/\b(location|address|parking|park|where|directions)\b/.test(value)) return 'location';
    if (serviceFor(value) || /\b(service|services|offer)\b/.test(value)) return 'services';
    if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(value)) return 'greeting';
    return 'fallback';
  }

  // UTC dates below represent calendar dates in the clinic's timezone, not instants.
  function clinicClock() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: CLINIC_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const value = type => Number(parts.find(part => part.type === type).value);
    return { date: new Date(Date.UTC(value('year'), value('month') - 1, value('day'))), minutes: value('hour') * 60 + value('minute') };
  }

  function slotLabel(date, minutes) {
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
    const hour = Math.floor(minutes / 60);
    return `${day} · ${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'} (Austin time)`;
  }

  function nearestSlots(request) {
    const text = request.toLowerCase();
    const now = clinicClock();
    let targetDate = null;
    let weekday = DAY_NAMES.findIndex(day => new RegExp(`\\b${day}(?:s)?\\b`).test(text));
    const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (iso) {
      targetDate = new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
      if (targetDate.getUTCFullYear() !== Number(iso[1]) || targetDate.getUTCMonth() !== Number(iso[2]) - 1 || targetDate.getUTCDate() !== Number(iso[3]) || targetDate < now.date) return [];
      weekday = -1;
    } else if (/\btoday\b/.test(text)) targetDate = now.date;
    else if (/\btomorrow\b/.test(text)) targetDate = new Date(now.date.getTime() + 86400000);
    const morning = /\bmorning\b/.test(text);
    const afternoon = /\bafternoon\b/.test(text);
    const evening = /\bevening\b/.test(text);
    const time = text.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/);
    const requestedMinutes = time ? (Number(time[1]) % 12 + (time[3] === 'pm' ? 12 : 0)) * 60 + Number(time[2] || 0) : null;
    const slots = [];
    const startOffset = targetDate ? Math.round((targetDate - now.date) / 86400000) : 0;
    for (let offset = startOffset; offset < startOffset + 22 && slots.length < 3; offset += 1) {
      const date = new Date(now.date.getTime() + offset * 86400000);
      const day = date.getUTCDay();
      if (day === 0 || (weekday >= 0 && day !== weekday) || (targetDate && date.getTime() !== targetDate.getTime())) continue;
      const times = day === 6 ? [540, 630, 780] : [540, 660, 840, 990, 1020];
      if (requestedMinutes !== null) times.sort((a, b) => Math.abs(a - requestedMinutes) - Math.abs(b - requestedMinutes));
      for (const minutes of times) {
        if (offset === 0 && minutes <= now.minutes + 30) continue;
        if ((morning && minutes >= 720) || (afternoon && (minutes < 720 || minutes >= 1020)) || (evening && minutes < 1020)) continue;
        slots.push(slotLabel(date, minutes));
        if (slots.length === 3) break;
      }
    }
    return slots;
  }

  let instance;
  function init() {
    if (instance) return instance;
    const panel = document.getElementById('ava-panel');
    const launcher = document.getElementById('chat-launcher');
    const messages = document.getElementById('chat-messages');
    const chips = document.getElementById('chat-chips');
    const input = document.getElementById('chat-input');
    const form = document.getElementById('chat-form');
    let state = 'idle';
    let booking = {};
    let slots = [];
    let context = '';
    let welcomed = false;
    let returnFocus = launcher;
    let queue = Promise.resolve();
    let pending = 0;

    const scroll = () => { messages.scrollTop = messages.scrollHeight; };
    function addMessage(text, who = 'agent') {
      const node = document.createElement('div');
      node.className = `message ${who}`;
      node.textContent = text; // Never interpret user input as HTML.
      messages.append(node);
      scroll();
      return node;
    }

    function setChips(options = []) {
      chips.replaceChildren();
      options.forEach(label => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip';
        button.textContent = label;
        button.addEventListener('click', () => submit(label));
        chips.append(button);
      });
    }

    async function reply(text, options = [], afterReply) {
      setChips();
      const indicator = document.createElement('div');
      indicator.className = 'message agent typing';
      indicator.setAttribute('aria-label', 'Ava is typing');
      for (let i = 0; i < 3; i += 1) { const dot = document.createElement('span'); dot.setAttribute('aria-hidden', 'true'); indicator.append(dot); }
      messages.append(indicator);
      scroll();
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 600));
      indicator.remove();
      if (text) addMessage(text);
      if (afterReply) afterReply();
      setChips(options);
      scroll();
    }

    // Serialize replies so rapid clicks cannot skip states or create duplicate bookings.
    function enqueue(work) {
      pending += 1;
      input.readOnly = true;
      form.querySelector('button').disabled = true;
      queue = queue.then(work).catch(error => {
        console.error('Ava chat error:', error);
        state = 'idle';
        booking = {};
        addMessage('Sorry, let’s try that again. How can I help?');
        setChips(WELCOME_CHIPS);
      }).finally(() => {
        pending -= 1;
        if (!pending) {
          input.readOnly = false;
          form.querySelector('button').disabled = false;
        }
      });
      return queue;
    }

    function stateChips() {
      if (state === 'service') return Object.values(SERVICES).map(service => service.name);
      if (state === 'datetime') return ['Earliest available', 'Tomorrow morning', 'Friday afternoon'];
      if (state === 'slot') return slots;
      if (state === 'confirm') return ['Confirm', 'Change'];
      if (state === 'change') return ['Change name', 'Change phone', 'Change service', 'Change date', 'Start over'];
      if (state === 'emergency') return ['Yes, book it', 'No, thanks'];
      return [];
    }

    async function startBooking(emergency = false) {
      booking = emergency ? { service: 'emergency', datetime: slotLabel(clinicClock().date, 990) } : {};
      state = 'name';
      await reply('I can help with a demo appointment. What is the patient’s name? Please use sample details — nothing is sent to a clinic.', ['Cancel booking']);
    }

    function confirmationCard() {
      const card = document.createElement('div');
      card.className = 'message agent confirmation';
      const heading = document.createElement('h3'); heading.textContent = 'Your visit, at a glance'; card.append(heading);
      const details = document.createElement('dl');
      [['Patient', booking.name], ['Phone', booking.phone], ['Service', SERVICES[booking.service].name], ['Date & time', booking.datetime], ['Clinic', CLINIC_ADDRESS]].forEach(([label, value]) => {
        const dt = document.createElement('dt'); dt.textContent = label;
        const dd = document.createElement('dd'); dd.textContent = value;
        details.append(dt, dd);
      });
      card.append(details);
      const actions = document.createElement('div'); actions.className = 'confirmation-actions';
      ['Confirm', 'Change'].forEach(label => {
        const button = document.createElement('button'); button.type = 'button'; button.className = `button${label === 'Change' ? ' button-outline' : ''}`; button.textContent = label;
        button.addEventListener('click', () => { if (state === 'confirm' && !pending) submit(label); });
        actions.append(button);
      });
      card.append(actions); messages.append(card); scroll();
    }

    async function nextBookingStep() {
      if (!booking.name) { state = 'name'; await reply('What is the patient’s name?'); }
      else if (!booking.phone) { state = 'phone'; await reply(`Thanks, ${booking.name}. What phone number should we use? A sample number with at least 7 digits works.`); }
      else if (!booking.service) { state = 'service'; await reply('What would you like to come in for?', stateChips()); }
      else if (!booking.datetime) { state = 'datetime'; await reply('When would you like to visit? Try “Friday morning”, “tomorrow at 2 PM”, or a date like YYYY-MM-DD. All slots use Austin time.', stateChips()); }
      else { state = 'confirm'; await reply('Please check your demo appointment details.', [], confirmationCard); }
    }

    async function handleBooking(text) {
      if (state === 'name') {
        if (text.length < 2 || !/[\p{L}]/u.test(text)) { await reply('Please enter a name with at least two characters. A sample name is fine.'); return; }
        booking.name = text;
      } else if (state === 'phone') {
        if (text.replace(/\D/g, '').length < 7) { await reply('Could you try that number again? Please include at least 7 digits, with an area code if you have one.'); return; }
        booking.phone = text;
      } else if (state === 'service') {
        const service = serviceFor(text);
        if (!service) { await reply('Please choose one of our services below.', stateChips()); return; }
        booking.service = service;
      } else if (state === 'datetime' || state === 'slot') {
        if (state === 'slot' && slots.includes(text)) booking.datetime = text;
        else {
          slots = nearestSlots(text);
          if (!slots.length) { state = 'datetime'; await reply('I couldn’t find a demo slot for that preference. We’re closed Sundays. Please try a different day or “Earliest available”.', stateChips()); return; }
          state = 'slot';
          await reply('Here are the nearest demo slots I can offer. Choose one to review your booking, or tell me another preference.', slots);
          return;
        }
      } else if (state === 'confirm') {
        if (/^(confirm|yes|yes please|ok|okay)[.!]?$/i.test(text)) {
          const reference = `BS-${Math.random().toString(36).slice(2, 7).toUpperCase().padEnd(5, '0')}`;
          state = 'idle';
          context = '';
          await reply(`Your demo visit is confirmed, ${booking.name}!\n\nReference: ${reference}\n${SERVICES[booking.service].name}\n${booking.datetime}\n${CLINIC_ADDRESS}\n\nAdd a reminder to your calendar and bring your insurance card. This is a simulation; no real appointment has been reserved.`, WELCOME_CHIPS);
          booking = {};
          return;
        }
        if (/change|edit|no/i.test(text)) { state = 'change'; await reply('Of course. What would you like to change?', stateChips()); return; }
        await reply('Choose Confirm to finish your demo booking, or Change to edit a detail.', stateChips()); return;
      } else if (state === 'change') {
        if (/name/i.test(text)) delete booking.name;
        else if (/phone|number/i.test(text)) delete booking.phone;
        else if (/service/i.test(text)) { delete booking.service; delete booking.datetime; }
        else if (/date|time/i.test(text)) delete booking.datetime;
        else { await reply('Choose the detail you’d like to update.', stateChips()); return; }
      }
      await nextBookingStep();
    }

    async function handle(text) {
      const value = text.toLowerCase();
      if (/^(cancel( booking)?|start over|restart)$/i.test(text)) {
        state = 'idle'; booking = {}; slots = []; context = '';
        if (/start over|restart/i.test(text)) await startBooking();
        else await reply('No problem — the demo request has been canceled. What else can I help with?', WELCOME_CHIPS);
        return;
      }
      // Clinical questions never get medical advice, including during booking.
      if (CLINICAL.test(value)) {
        if (state === 'idle') context = '';
        await reply('Dr. Lee will advise at your visit after understanding your concerns. I can help arrange a demo appointment, but I can’t give clinical advice.', state === 'idle' ? ['Book an appointment'] : stateChips());
        return;
      }
      if (state === 'callback') {
        if (text.replace(/\D/g, '').length < 7) { await reply('Please share a sample phone number with at least 7 digits.'); return; }
        state = 'idle';
        await reply(`In a real booking, a team member would call ${text} within 30 minutes during opening hours. This demo does not arrange a real call. You can also reach the fictional clinic at ${CLINIC_PHONE}.`, WELCOME_CHIPS);
        return;
      }
      if (state === 'emergency') {
        if (/^(yes|book|confirm|ok|sure)/i.test(text)) await startBooking(true);
        else if (/^(no|not)/i.test(text)) { state = 'idle'; await reply('Of course. I’m here if you’d like help with another question.', WELCOME_CHIPS); }
        else await reply('Would you like to start a demo booking for today at 4:30 PM?', stateChips());
        return;
      }
      if (state !== 'idle') { await handleBooking(text); return; }
      const service = serviceFor(text);
      const detectedIntent = intentFor(text);
      const priceFollowUp = context === 'prices' && service && (detectedIntent === 'services' || text === SERVICES[service].name);
      const intent = priceFollowUp ? 'prices' : detectedIntent;
      if (intent !== 'prices' && intent !== 'services') context = '';
      switch (intent) {
        case 'book': await startBooking(); break;
        case 'greeting': await reply(`Hello! I’m Ava, the AI receptionist at ${CLINIC_NAME}. How can I help you smile today?`, WELCOME_CHIPS); break;
        case 'hours': await reply(`${Object.values(HOURS).join('\n')}\nAll hours are Austin local time.`, ['Book an appointment', 'Where are you located?']); break;
        case 'insurance': await reply(INSURANCE, ['Book an appointment', 'Prices']); break;
        case 'location': await reply(`You’ll find ${CLINIC_NAME} at ${CLINIC_ADDRESS}. There’s free parking behind the clinic and a step-free entrance.`, ['Opening hours', 'Book an appointment']); break;
        case 'prices':
          context = 'prices';
          await reply(service ? `${SERVICES[service].name}: ${PRICES[service]}. These are demo estimates; your dentist will confirm the cost before treatment.` : `${Object.keys(SERVICES).map(key => `${SERVICES[key].name}: ${PRICES[key]}`).join('\n')}\n\nIllustrative ranges only. Which service would you like to explore?`, Object.values(SERVICES).map(item => item.name));
          break;
        case 'services':
          await reply(service ? `${SERVICES[service].name}: ${SERVICES[service].description}\n${context === 'prices' ? 'Price range' : 'Illustrative price'}: ${PRICES[service]}. Your dentist confirms a personalized estimate.` : 'We offer checkups and cleanings, whitening, invisible aligners, implants, emergency care, and pediatric dentistry. Which would you like to know about?', service ? ['Book an appointment', 'Prices'] : Object.values(SERVICES).map(item => item.name));
          break;
        case 'emergency':
          // Fixed same-day scenario requested by the spec, even outside actual clinic hours.
          state = 'emergency';
          await reply('I’m sorry you’re dealing with this. In this demo scenario, the earliest slot today is 4:30 PM — shall I book it? This simulated slot is not live availability.', stateChips());
          break;
        case 'human': state = 'callback'; await reply('Of course. A human would call within 30 minutes during opening hours. What number should they use? Please enter a sample number; this demo won’t place a call.', ['Cancel']); break;
        default: await reply('I can help with appointments, prices, insurance, hours or emergencies — what would you like to know?', WELCOME_CHIPS);
      }
    }

    function submit(raw) {
      const text = raw.trim().slice(0, 500);
      if (!text || pending) return;
      input.value = '';
      messages.querySelectorAll('.confirmation button').forEach(button => { button.disabled = true; });
      addMessage(text, 'user');
      setChips();
      enqueue(() => handle(text));
      input.focus();
    }

    function open(action, service) {
      if (panel.hidden) returnFocus = document.activeElement;
      panel.hidden = false;
      launcher.setAttribute('aria-expanded', 'true');
      launcher.classList.add('has-opened');
      input.focus();
      if (!welcomed) {
        welcomed = true;
        enqueue(() => reply(`Hi, I’m Ava, the AI receptionist at ${CLINIC_NAME}. I can help with appointments and questions about our practice. What brings you in today?`, WELCOME_CHIPS));
      }
      if (action === 'book') enqueue(async () => {
        addMessage('I’d like to book a visit.', 'user');
        if (state !== 'idle') await reply('You already have a request in progress. Let’s continue, or choose Start over.', [...stateChips(), 'Start over']);
        else await startBooking();
      });
      if (action === 'service' && SERVICES[service]) {
        // Prefill instead of submitting: users can edit the question before sending.
        input.value = `Tell me about ${SERVICES[service].name}.`;
        if (state !== 'idle') enqueue(() => reply('You can finish your current request, or type Cancel to ask a different question.', [...stateChips(), 'Cancel']));
      }
      scroll();
    }

    function close() {
      panel.hidden = true;
      launcher.setAttribute('aria-expanded', 'false');
      if (returnFocus && returnFocus.isConnected) returnFocus.focus();
      else launcher.focus();
    }

    launcher.addEventListener('click', () => { if (panel.hidden) open(); else close(); });
    document.getElementById('chat-close').addEventListener('click', close);
    panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
    form.addEventListener('submit', event => { event.preventDefault(); submit(input.value); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submit(input.value); }
    });
    instance = Object.freeze({ open });
    return instance;
  }

  window.AvaChat = Object.freeze({ init });
})();
