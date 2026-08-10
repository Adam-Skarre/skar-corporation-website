(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const promptLibrary = {
    operations: {
      prompt: 'Where is the proposed capacity expansion most exposed, and what requires human approval?',
      title: 'Stage the commitment—and preserve an exit path.',
      summary: 'The demand signal supports phased capacity. Supplier concentration and the timing of capital release make a single irreversible commitment unnecessarily exposed.',
      findings: [
        'Demand supports a staged release, with the second tranche tied to confirmed utilization.',
        'Supplier lead time is the material constraint; the demand forecast is not the limiting factor.',
        'Capital release and dependency concentration require named-owner approval before execution.'
      ],
      sources: ['Capacity plan · Q4', 'Supplier register', 'Demand forecast', 'Capital policy'],
      evidence: '4 approved operating sources',
      control: 'Capital gate · Operations lead',
      action: 'Review the phased option'
    },
    research: {
      prompt: 'What forces are changing industrial automation, and which conclusions are facts versus assumptions?',
      title: 'The direction is clear. The adoption curve is not.',
      summary: 'Connected operations, labor constraints, and falling deployment friction support continued adoption. Integration capacity remains the main source of uncertainty.',
      findings: [
        'Primary evidence supports continued investment in connected and increasingly adaptive operations.',
        'Labor availability and systems integration capacity constrain the rate of adoption.',
        'Scenario ranges should remain visible instead of collapsing into one confident forecast.'
      ],
      sources: ['Industry survey', 'Capital tracker', 'Labor outlook', 'Deployment benchmarks'],
      evidence: '6 reviewed source classes',
      control: 'Citations retained',
      action: 'Compare adoption scenarios'
    },
    client: {
      prompt: 'What could put this client renewal at risk, based on account history, usage, and service events?',
      title: 'Renewal is supportable—with two issues resolved first.',
      summary: 'Core usage is durable and adoption is broadening. Two open service events and an out-of-policy pricing request create avoidable renewal risk.',
      findings: [
        'Usage expansion indicates durable value in the customer’s primary workflow.',
        'Two unresolved reliability events are the strongest source of renewal friction.',
        'The proposed pricing exception sits outside the approved commercial boundary.'
      ],
      sources: ['CRM history', 'Product usage', 'Service events', 'Commercial terms'],
      evidence: '4 connected account systems',
      control: 'Pricing approval · Account lead',
      action: 'Resolve service risk first'
    },
    diligence: {
      prompt: 'Which assumptions carry this investment case, and what evidence would change the recommendation?',
      title: 'The opportunity is plausible. Three assumptions carry the case.',
      summary: 'The base case depends on stable customer concentration, a specific operating change, and an unproven recovery timeline in the downside scenario.',
      findings: [
        'The demand case depends on customer concentration remaining stable through the investment period.',
        'Margin expansion is not supported without the modeled operating change being delivered on time.',
        'The downside case lacks evidence for both recovery timing and interim liquidity needs.'
      ],
      sources: ['Investment memo', 'Customer cohort', 'Operating model', 'Downside case'],
      evidence: '5 diligence files',
      control: 'Investment committee',
      action: 'Test the downside case'
    }
  };

  const fallbackScenario = {
    state: 'PRODUCT PREVIEW',
    title: 'This preview is focused on business work.',
    summary: 'Try a calculation or one of the guided examples. A deployed SKAR AI instance can answer broader questions through approved models and company sources.',
    findings: [
      'Choose a guided example to see how evidence, uncertainty, and ownership remain visible.',
      'Try a direct calculation such as “5 + 5” or ask for the capital of a major country.',
      'Production deployments connect to a protected model endpoint without exposing credentials in the browser.'
    ],
    sources: ['Public preview capability'],
    evidence: 'No company source connected',
    control: 'Browser-only preview',
    action: 'Choose a guided example'
  };

  const capitalScenario = (input) => {
    const match = input.toLowerCase().match(/capital\s+of\s+(?:the\s+)?([a-z .'-]+)/i);
    if (!match) return null;
    const country = match[1].replace(/[?.!]+$/g, '').trim();
    const capitals = {
      'spain': 'Madrid', 'france': 'Paris', 'germany': 'Berlin', 'italy': 'Rome',
      'portugal': 'Lisbon', 'united kingdom': 'London', 'uk': 'London', 'england': 'London',
      'ireland': 'Dublin', 'netherlands': 'Amsterdam', 'belgium': 'Brussels',
      'switzerland': 'Bern', 'austria': 'Vienna', 'denmark': 'Copenhagen',
      'norway': 'Oslo', 'sweden': 'Stockholm', 'finland': 'Helsinki', 'poland': 'Warsaw',
      'greece': 'Athens', 'turkey': 'Ankara', 'ukraine': 'Kyiv', 'russia': 'Moscow',
      'united states': 'Washington, D.C.', 'united states of america': 'Washington, D.C.',
      'us': 'Washington, D.C.', 'usa': 'Washington, D.C.', 'canada': 'Ottawa',
      'mexico': 'Mexico City', 'brazil': 'Brasília', 'argentina': 'Buenos Aires',
      'china': 'Beijing', 'japan': 'Tokyo', 'south korea': 'Seoul', 'india': 'New Delhi',
      'pakistan': 'Islamabad', 'bangladesh': 'Dhaka', 'vietnam': 'Hanoi',
      'thailand': 'Bangkok', 'indonesia': 'Jakarta', 'australia': 'Canberra',
      'new zealand': 'Wellington', 'egypt': 'Cairo', 'nigeria': 'Abuja',
      'kenya': 'Nairobi', 'south africa': 'Pretoria', 'morocco': 'Rabat',
      'saudi arabia': 'Riyadh', 'united arab emirates': 'Abu Dhabi', 'uae': 'Abu Dhabi'
    };
    const capital = capitals[country];
    if (!capital) return null;
    const displayCountry = country.replace(/\b\w/g, (letter) => letter.toUpperCase());
    return {
      state: 'ANSWER READY',
      title: capital,
      summary: `${capital} is the capital of ${displayCountry}.`,
      findings: ['This common reference fact was answered directly in the public preview.', 'No company information or external model call was required.'],
      sources: ['SKAR AI preview · Common reference data'],
      evidence: 'Reference fact',
      control: 'No approval required',
      action: 'Ask a follow-up'
    };
  };

  const extractExpression = (input) => {
    const expression = input
      .trim()
      .replace(/^(?:please\s+)?(?:what(?:'s| is)|calculate|compute|solve|evaluate)\s+/i, '')
      .replace(/[=?]+\s*$/g, '')
      .replace(/,/g, '')
      .replace(/÷/g, '/')
      .replace(/×/g, '*')
      .replace(/(\d)\s*[xX]\s*(?=\d|\()/g, '$1*')
      .trim();
    if (!/\d/.test(expression) || !/[+\-*/%^]/.test(expression)) return null;
    if (!/^[\d\s.+\-*/%^()]+$/.test(expression)) return null;
    return expression;
  };

  const calculateExpression = (expression) => {
    const tokens = [];
    let position = 0;
    while (position < expression.length) {
      const rest = expression.slice(position);
      const whitespace = rest.match(/^\s+/);
      if (whitespace) { position += whitespace[0].length; continue; }
      const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (number) { tokens.push({ type: 'number', value: Number(number[0]) }); position += number[0].length; continue; }
      const operator = rest[0];
      if ('+-*/%^()'.includes(operator)) { tokens.push({ type: operator, value: operator }); position += 1; continue; }
      throw new Error('Unsupported expression');
    }

    let cursor = 0;
    const peek = (type) => tokens[cursor]?.type === type;
    const take = (type) => {
      if (!peek(type)) throw new Error('Invalid expression');
      return tokens[cursor++];
    };
    const primary = () => {
      if (peek('number')) return take('number').value;
      if (peek('(')) {
        take('(');
        const value = expressionParser();
        take(')');
        return value;
      }
      throw new Error('Number expected');
    };
    const unary = () => {
      if (peek('+')) { take('+'); return unary(); }
      if (peek('-')) { take('-'); return -unary(); }
      return primary();
    };
    const power = () => {
      const left = unary();
      if (!peek('^')) return left;
      take('^');
      return Math.pow(left, power());
    };
    const term = () => {
      let value = power();
      while (peek('*') || peek('/') || peek('%')) {
        const operator = tokens[cursor++].type;
        const right = power();
        if ((operator === '/' || operator === '%') && right === 0) throw new Error('Division by zero');
        if (operator === '*') value *= right;
        if (operator === '/') value /= right;
        if (operator === '%') value %= right;
      }
      return value;
    };
    const expressionParser = () => {
      let value = term();
      while (peek('+') || peek('-')) {
        const operator = tokens[cursor++].type;
        const right = term();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    };

    const result = expressionParser();
    if (cursor !== tokens.length || !Number.isFinite(result) || Math.abs(result) > 1e15) throw new Error('Result outside preview limits');
    return result;
  };

  const formatResult = (value) => {
    if (Number.isInteger(value)) return value.toLocaleString('en-US');
    const rounded = Number(value.toPrecision(12));
    return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
  };

  const calculationScenario = (input) => {
    const expression = extractExpression(input);
    if (!expression) return null;
    try {
      const result = calculateExpression(expression);
      const formatted = formatResult(result);
      const displayExpression = expression.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\s+/g, ' ').trim();
      return {
        kind: 'calculation',
        state: 'ANSWER READY',
        title: formatted,
        summary: `${displayExpression} equals ${formatted}.`,
        findings: [
          'The expression was parsed and calculated directly in this browser.',
          'No company information, external source, or model call was required.'
        ],
        sources: ['Local calculation · No external data'],
        evidence: 'Direct calculation',
        control: 'No approval required',
        action: 'Ask a follow-up'
      };
    } catch (error) {
      return {
        ...fallbackScenario,
        state: 'CALCULATION NEEDS REVIEW',
        title: error.message === 'Division by zero' ? 'That expression divides by zero.' : 'I could not safely evaluate that expression.',
        summary: 'Check the operators and parentheses, then try the calculation again.',
        evidence: 'Expression rejected safely',
        action: 'Correct the expression'
      };
    }
  };

  const chooseScenario = (input) => {
    const normalized = input.toLowerCase();
    const calculation = calculationScenario(input);
    if (calculation) return calculation;
    const capital = capitalScenario(input);
    if (capital) return capital;
    if (/capacity|supplier|operation|production|constraint|expansion/.test(normalized)) return promptLibrary.operations;
    if (/research|evidence|source|industry|market|trend|automation/.test(normalized)) return promptLibrary.research;
    if (/client|renewal|customer|account|service|pricing/.test(normalized)) return promptLibrary.client;
    if (/diligence|investment|risk|deal|acquisition|finance|assumption/.test(normalized)) return promptLibrary.diligence;
    return null;
  };

  const requestModelScenario = async (prompt) => {
    const endpoint = String(window.SKAR_AI_ENDPOINT || document.querySelector('meta[name="skar-ai-endpoint"]')?.content || '').trim();
    if (!endpoint) return null;
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!result.ok) throw new Error(`SKAR AI endpoint returned ${result.status}`);
    const data = await result.json();
    if (!data || typeof data.title !== 'string' || typeof data.summary !== 'string') throw new Error('Invalid SKAR AI response');
    return {
      state: typeof data.state === 'string' ? data.state : 'ANSWER READY',
      title: data.title,
      summary: data.summary,
      findings: Array.isArray(data.findings) ? data.findings.slice(0, 5).map(String) : [],
      sources: Array.isArray(data.sources) ? data.sources.slice(0, 6).map(String) : ['SKAR AI secure endpoint'],
      evidence: typeof data.evidence === 'string' ? data.evidence : 'Model response',
      control: typeof data.control === 'string' ? data.control : 'Human review',
      action: typeof data.action === 'string' ? data.action : 'Review the answer'
    };
  };

  const demo = document.querySelector('[data-skar-ai-demo]');
  if (demo) {
    const shell = demo.querySelector('.sai-answer-shell');
    const form = demo.querySelector('[data-skar-ai-form]');
    const input = demo.querySelector('[data-skar-ai-input]');
    const submit = demo.querySelector('[data-ai-submit]');
    const submitLabel = submit?.querySelector('span');
    const response = demo.querySelector('[data-ai-response]');
    const stateLabel = demo.querySelector('[data-ai-state]');
    const question = demo.querySelector('[data-ai-question]');
    const answer = demo.querySelector('[data-ai-answer]');
    const summary = demo.querySelector('[data-ai-summary]');
    const findings = demo.querySelector('[data-ai-findings]');
    const sources = demo.querySelector('[data-ai-sources]');
    const evidence = demo.querySelector('[data-ai-evidence]');
    const control = demo.querySelector('[data-ai-control]');
    const action = demo.querySelector('[data-ai-action]');
    const count = demo.querySelector('[data-ai-count]');
    const reset = demo.querySelector('[data-ai-reset]');
    let timer = 0;

    const updateCount = () => { if (count) count.textContent = String(input.value.length); };
    const populateResponse = (prompt, scenario) => {
      question.textContent = prompt;
      answer.textContent = scenario.title;
      summary.textContent = scenario.summary;
      findings.replaceChildren(...scenario.findings.map((finding, index) => {
        const item = document.createElement('li');
        const number = document.createElement('span');
        number.textContent = String(index + 1).padStart(2, '0');
        item.append(number, document.createTextNode(finding));
        return item;
      }));
      sources.replaceChildren(...scenario.sources.map((source) => {
        const chip = document.createElement('span');
        chip.textContent = source;
        return chip;
      }));
      evidence.textContent = scenario.evidence;
      control.textContent = scenario.control;
      action.textContent = scenario.action;
    };

    input.addEventListener('input', updateCount);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    demo.querySelectorAll('[data-ai-prompt]').forEach((button) => {
      button.addEventListener('click', () => {
        const scenario = promptLibrary[button.dataset.aiPrompt];
        input.value = scenario.prompt;
        updateCount();
        input.focus();
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const prompt = input.value.trim();
      if (!prompt) {
        input.focus();
        return;
      }

      window.clearTimeout(timer);
      shell.dataset.demoState = 'thinking';
      response.setAttribute('aria-busy', 'true');
      stateLabel.textContent = 'UNDERSTANDING THE QUESTION';
      submit.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Working…';
      shell.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

      let scenario = chooseScenario(prompt);
      try {
        scenario = scenario || await requestModelScenario(prompt) || fallbackScenario;
      } catch (error) {
        scenario = {
          ...fallbackScenario,
          state: 'SECURE MODEL UNAVAILABLE',
          title: 'The live model could not be reached.',
          summary: 'The request was not sent again and no browser credential was exposed. Try a supported calculation or guided workflow while the secure endpoint is unavailable.',
          evidence: 'Endpoint connection failed',
          action: 'Try a supported question'
        };
      }
      populateResponse(prompt, scenario);

      timer = window.setTimeout(() => {
        shell.dataset.demoState = 'ready';
        response.setAttribute('aria-busy', 'false');
        stateLabel.textContent = scenario.state || 'BRIEF READY · HUMAN REVIEW REQUIRED';
        submit.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Ask SKAR AI';
      }, reducedMotion ? 80 : scenario.kind === 'calculation' ? 360 : 900);
    });

    reset.addEventListener('click', () => {
      window.clearTimeout(timer);
      shell.dataset.demoState = 'idle';
      response.setAttribute('aria-busy', 'false');
      input.value = '';
      updateCount();
      window.setTimeout(() => input.focus(), 40);
    });
  }

  const stackContent = {
    context: {
      index: '01 / CONTEXT',
      title: 'Know what the system is allowed to know.',
      copy: 'Connect only approved information, preserve source-level access, and retain the provenance required to examine an answer.',
      boundary: 'Source permissions', evidence: 'Citations retained'
    },
    intelligence: {
      index: '02 / INTELLIGENCE',
      title: 'Choose capability around the work.',
      copy: 'Use the model, retrieval pattern, prompt structure, and memory behavior that fit the task without tying the operating system to one provider.',
      boundary: 'Task-specific behavior', evidence: 'Model evaluations'
    },
    tools: {
      index: '03 / TOOLS',
      title: 'Give intelligence a bounded way to work.',
      copy: 'Search, calculate, draft, and update through explicit tools whose inputs, outputs, permissions, and failure states can be observed.',
      boundary: 'Approved tool actions', evidence: 'Execution trace'
    },
    control: {
      index: '04 / CONTROL',
      title: 'Surround every workflow with proof and recovery.',
      copy: 'Evaluate representative work and edge conditions, enforce policy, monitor exceptions, and maintain a tested path to stop or recover the system.',
      boundary: 'Release thresholds', evidence: 'Logs and test suites'
    },
    authority: {
      index: '05 / AUTHORITY',
      title: 'Keep consequential judgment with people.',
      copy: 'Name who sets the objective, reviews exceptions, and owns the commitment. Automation expands only when the action is safely bounded.',
      boundary: 'Decision rights', evidence: 'Approval record'
    }
  };

  const stack = document.querySelector('[data-ai-stack]');
  if (stack) {
    const buttons = [...stack.querySelectorAll('[data-stack]')];
    const index = stack.querySelector('[data-stack-index]');
    const title = stack.querySelector('[data-stack-title]');
    const copy = stack.querySelector('[data-stack-copy]');
    const boundary = stack.querySelector('[data-stack-boundary]');
    const evidence = stack.querySelector('[data-stack-evidence]');

    buttons.forEach((button) => button.addEventListener('click', () => {
      const item = stackContent[button.dataset.stack];
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      index.textContent = item.index;
      title.textContent = item.title;
      copy.textContent = item.copy;
      boundary.textContent = item.boundary;
      evidence.textContent = item.evidence;
    }));
  }
})();
