(() => {
  "use strict";

  const HOST_ID = "keepit-chatgpt-ai-toolbar-host";
  const UI_LANGUAGE_KEY = "lhnSettings";
  const SOURCE_LABELS = { en:"Source:", vi:"Nguồn:", ko:"출처:" };
  const TABS_LABELS = { en:"AI services", vi:"Các AI", ko:"AI 서비스" };
  const PANEL_LABELS = { en:"panel", vi:"khung AI", ko:"AI 패널" };
  const CHEVRON_LABELS = { en:"Show or hide AI services", vi:"Hiện/ẩn hàng AI", ko:"AI 서비스 표시/숨기기" };
  const AUTO_SEND_LABELS = { en:"Auto-send", vi:"Tự động gửi", ko:"자동 전송" };
  const AUTO_SEND_STATUS_LABELS = {
    en:{ on:"Auto-send is on", off:"Auto-send is off" },
    vi:{ on:"Tự động gửi đang bật", off:"Tự động gửi đang tắt" },
    ko:{ on:"자동 전송 켜짐", off:"자동 전송 꺼짐" },
  };
  const PROVIDERS = ["chatgpt", "gemini", "claude", "grok"];
  const PROVIDER_NAMES = { chatgpt:"ChatGPT", gemini:"Gemini", claude:"Claude", grok:"Grok" };
  const PROVIDER_SITES = {
    chatgpt:"https://chatgpt.com/",
    gemini:"https://gemini.google.com/",
    claude:"https://claude.ai/",
    grok:"https://grok.com/",
  };
  const PROVIDER_ICON_DATA = {
    chatgpt:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAYFBMVEX///8AAADz8/O/v7+qqqq4uLj4+Pjo6Oh+fn7h4eHExMSwsLDKysrZ2dmioqImJiYrKytpaWmNjY3T09NMTExCQkJUVFR2dnYbGxszMzOHh4cODg5cXFwhISGUlJQ5OTkNyEhkAAADGElEQVRYhe1X2XbqMAzMQuw4KxBCCKHl///y2pJl5AVKOee+VS/E4JloGckmy/7sP5rqqnJSn6L765aj1f0HcHnLmR2K3+LLPLAuE7LrpneJKnxvq6RU1RkXSPS1TG/gO4jcvU2dPWdO8ie8MNsaFs8YxLP7gaCGmMn6E4Dmoen7bofO1C/xhd5xdYsFEHvnkIJkHF8RDHpDwZ61Dfz3Nvc8jE0rYMGnDoOvhb8BGJ7CO+NzaZ4kxnsmLUuX/Tp0isHvADJbCz94qWNfrCumTPsk/mrrVJCj7j3fXgGP+jHVZIecEezYpupCv9whe0o/VTEeKnbdMQL8Xs2AXVfXWCaG7wgPDVTCByewSshb/Aqha0pMG5Y3IEAlbPg+UcPq0swJgsEKzCNobBvsqQcfjRWFMFqXOQGbKjdSAXE2AV5R0TgBeF92WAOn/yGWd4ZlVwmC4QExeQQrDnxlTWvokkUE1AYCJbZSKmBk+VKqSZ2cgG1R6MTBpsLsmkOCMSLgG4Ls17ntOTIt700QgUwT4GzaGlp7LpQ8iVuZJGgLrKu0b8z5eJVUKAl7TkUbE+henEy/V5QUL4aZANMXUiQJYEwAgdiC0WgqY2fpQAlLEAgiyPZhP6wPfVIHBmX0PIgJeq7wHmebLySf4MKmPxoMsYUmehVL2SNITaWgS45+MwUEQyRm3am4b0+nhnRDEjvbI9CfXwGeRi9r/mlvOZuwjMc8cTZofd9t6LbCw8VF5ROYG8AW4g3B6vzQu5oLK4VHYAdwIgTTUDgv8hl752zDYQQDyCRxxlfUH9NM2VgpoSQkQb8sMd5tMlybKxwmw6zajI7MZzeEEZKAdmTneoPFeJy59ydXrYG/VJAm6ZyH6IxWlufXC7MxILen0WhBenV7Crfno6dwPt1tBC8vadB1BzeqbPCuw2CWijTUGk6C29D1fXlE+Olx2WZT56m5hrA2MsG1SQGHpk4ewcn1rADv3rn7TwuewCPGc257felucBE3QNqE6vrCXru5vXNX94zGK9rv/3hoU7Vrn0/++iBH2Zbdx+g/e8f+AUjCHMA9oP1SAAAAAElFTkSuQmCC',
    gemini:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAABp1BMVEVHcEwks4M2ltktu2/sxyHkVmPkbFyGymJeieuhzlE7if00kO3qXVo7ifxKkez0uhzzqh4St3FLwWsxhv9Fhvj3vBj2R0gxhv8zh//KyTsrvWf6RUMUuWj0VkjxqCTwXU7zXEbsT1f4vRfb0THC1UOtcqnuZE3CaZH1nCCb1FnxSlAxhv+a01klrpoxhv85oc/wgjL4RkWDgdT2SEn6Q0FtyWW91UUxhv8yhv8yh/82h/43ivo+iPw5jfY6kPBHifg8nNNSifI8lOnsUVc8oMf2vhhLr5wUuWeTfMBqhuRJqqo7mNzyS053x2pDpblpw3KEgc1VtY/4RkXWYHZhvns0pLszqKutdKU7luPdW2y10EbCao7MZYOieLHYyi9fuYQetnbqkTLooitgk93nfka4bpmS0Fzysxx3hNlTnsxEunsqr5LTuDJLwG6Ku2aovU9kpLA/tIsxrJ29wT/Tf2q2hY+aiLBMl+GMlq1xmsLRcXjRjVuUrXPlvSW/eY6CjMfPnEvK0TrIrENxjdewqV6skouzm3GQn5R2uHZ2rotqqpoAshpHcEw3yyA9AAAAjXRSTlMA/hL+/v7+/v7+vlT91P0v/S1JLUaB3N7yEtwqgRJMvVNB3dpVSdTa2sV9fdPaha+w8rCFhbCv/////////////////////////////////////////////////////////////////////////////////////////////////////////////////wC9sE0CAAADIElEQVRYhc2V+1vSUBjHj1GghTM1byipaaV2v8LGRUVj3hCdSmVFJmaCoCKi4B0UsP7q3nO24eaVnT1PT9/fP5993/dsZwj972lu1skLgj7DW0F4o0tQLwj1enirIIyNWXUIekAw0KND8AoKDNyi59sJ/7mdWlBP+KnH1AWAx4KvD6kLiPwXygptMv/zI12FU/7bEA3fquAnXmvn2xT80MTSPa28Vc0PD9/QKDCbzVNKvrxcG//oLN/fX6mFbzUbjdvbKr6/97aG5xsxv7+P9y/xvZCSDRfzTqeztCmsxoWFjY2N/WRyc3PiYAnWJ/NOrrGEs2hbIHwS8wcHRxJPcJw71/Evgd/Z2UnmcoQ/KvKcGPvVi7j/AwJ8PpdLpVLAh9S8HefyElVdmD88PMznc4VUKp0OhcoZBW8XY2uovfjpXfM4wB/n84UC4UMM0+sivJ3jWLtssFWe+zSsdXdJ5uez2ezx8W6hsJZOh0NbDONykefbWZaVcZzGJ4oDqap78EtMNBol/O7vP2tr4fDWFuN2ORwceboosJ2m4bk0StUHKXt7YEhkV4GXBR4scMgC29nUqgR7kGgisbq6snICgvFwuA8LXJLAxrKXCPAIN0mCwWBRMDIyHu4b9ZAKHF4ACNSG4gg4TXUEDyYyouD7pHdkfLBv9BOpwJ03qJYoHWNHMJjJJGYrKkySABs87mIFWAHLipLzxyiO0pHJzIJgxXcyrazgkCrIiobLL8hOIjCZfNMXVJDfg6u/p/dgWDT5/NPqLYgG7Lj2VukEwaLP58cCpUFSXPs5w4FUKCsMikeJDbCJUi4UyNNFYpj0FoeQDCVfzN2nFWYUBg3XcreigmRwuzTwMIVcIQAVsMHj1vRjQcjkwxXi3oBsYLTxqAlXiMS964EZ0aD154pqiCC+LhlKOP+zeeePRSLx5fUANrzQziPkj8Wggmig4VENCCJly9hAMQCOJRYxlGHDMzoeKhgMc9hQTSlAFhCAgbYAVMCCubIaagEy8DwI6HnUwoOhRYfgBgh4zS+xMhaet+jh8Qx6JkComuepXwLJoJP/B/kLRT9a7+Axo0UAAAAASUVORK5CYII=',
    claude:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAG1BMVEXZdlbabEjacU/aZ0H+9/X67ejil4Hruavy0som81XtAAAD70lEQVRYhe1W2ZIbIQzUwQD//8XR0RKMvZWqVN5SYe0xYNRqtWSxRP/HPzvkL83nmjeE/CEer/GMzb2ce/4WQT4+aT4+Dh2D+71HcdsDIwlQFHTbYsnn6QhL2rMI5V+MJylInFSbjinH+Is6AavXvANgcUI7ADzwnDgpbfa14SeTAiep4VMgj7EVjA+CrRxfDj9eT/G2lwOof6/bpmPlwTBqj60NcwTOSUFDUs+puRVdA+Ke4NNt8+G1V5KZAxRiOkyOsk89RcCAkJGEivyRe7DcmV2osMYwI2BCGbgUgbjYEIRu7tiPh2GUpZ9zQHtNRA3hqP98ZAUlYRM8KMRETZXR6NSBl/yFplkAY8PjMCx9PHWeAN9YWsI1/9bD1woOz1SjHhQ0zFwIm1g9FPMmfjPoGnLX7AzM1jWcATaeo9mVChG5ZpTZMgOaDvA4AI2YugCgXihtJg1HFkbGO4NCwORYepy9AXoVE46Ia+yePWnPzKrKN/FbiphoOv8YM0yZ5trPnnSJ9z30RQJU7Pcwd8jjvwh9aeCfHEPA7ZvE3r6T5ezF9smA51rT+oX9pNRj9Nr5Gk+oa71mHrYOYH55AhoMt8H9gDCevSalhlwAOdH11Bg/SejGaYsw82GVkWv2fmdRrLVtgMtLghmhxeCTRDAotIgdjy8RPDKLzYJbU5ODm1I/Cick4Z9q4UFPMKQ+CAYsHUkWI30q6PVz0midkTuEsM9nArFymq8bxfRTWvsBhkZRc7EP2+Ru75U/fnmXo/UIFyfKcYG1IAuIws2jBp/uIvMDIQiqKNyFfmFWLFQ2upq67bJWsFzN7T1tKZcjBGuv+zcQ2mfv1OhIj6NMvxkGAYErTQzNqCHdf5bjNiLRRr0/GVh0VI1/OzQPyvmgCoDbv7mPe8hMvZimUtyJ6nfFRhkerxcDoxO3uqudN6L1ZKPB0ScNaD6JwDcNugOyHJHGZ6TaZmbo1DL1Vl5RQm3QWbi2YsQN41DO2qWPi3FZFawXB4Twac5+LOtmJZEw9GBCJn4N+rSW1NIzFkzCoSIIm9F82Qvx54jbCWa7GYcqYavv4y8AKQEq36AiiGbqRRVYHYLWnh2F/YkFbL7pAkD5PO0o1QxesYqG+B624YdVTmR6IwWAkwK3eEqeVsRMZ8V6shF7UU9ysauTKkdK6k14iJ4KfJ2LaukPwcGD5AwUW3p0BOP8BjYdQ3tKm2BQ6OlKy+IDNtp9ByK4IghIuAtaqiIGK22sWtUWgUudOPeKd776IrHO9/XBYHB0w0KOa+1ItF3VuhggAG5w1ZJaLyB9vzEhPfMGLrlBUy/fxwlkI7jk17365qL3Ny8SNn4BI7siq1gJmlgAAAAASUVORK5CYII=',
    grok:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAMAAACdt4HsAAAAQlBMVEVHcEwJCQkFBQUGBgYFBQUFBQUFBQVISEggICAFBQUFBQUAAAD8/Pz////t7e2NjY0zMzNSUlJvb2+wsLDJycnc3Nwxf3E3AAAACnRSTlMAHmtL8eDBAgWb/eryAgAAA1FJREFUWIWdV4uyoyAMVauiRgQB//9XNwQsENSuNzOd1so5hDxJ03xFiKZpP908jsPQ9/1SSN8PwzCOc/dpw8pK8M92HpZ7gfPHMLcXFB7+gGbiKfj2Xdrif6RrpoxCTM2L7aMSIjEIIca3+AXGxDD9AY8HHpsp4t/rj3gNyxwYvP3e4w0SoCX9IUT7B7wy3md9K7wC7w8Axgafzwh/VgBIKvwa/wOvwq0CBNW71owEjNzPxxltcBP/CDF221Yp180pnVHs0qW8wPy7gWuLWLnKdfXf8jCn1vsqddKnbT7XeCs9NImUW9Bbr5kCy/K5DAK/y8oEtUAG0OH7K92VDUHF7eUpXgEFHu9/5RadmzoNEB/hhzVa613Z1cM9fkMum7t1vCAwMsDdDnDGQXQC4lepSgLuRTwl4bed9lyW7LORT3IToB8ZAcBBq446/mAL1PqZQN3ij2iagqBverYs6H+Bd9Gz5REqArKgNPd49rJv2EKvZxFqCU8Bwb2wlATBBaWS9L8N/ic32nsCIBOiBfn+mBnSZ9PFa6aBrSIl4imVYowULYjZgEzATuDxjtwSQqF8z45AsVI4mlJLncWANjD3BN5KLAi8Wb5bkjOfCSiKSvyRzhxs9EAAlQYGvZYef2oQbJDtaKQpCnJtZObGcgGYrTBo9IJ+ICjiAIwrkwp2r2BpZEZgslCDXTF84HdPkbikXMCuVIV0XdIWns7uKhnOl6HYPBcUc5Gx5ztN5aA8ASdYQNZV5zzAUec61DUxENiKINYkXmyuCS6OcOJX4ARlYyE3RHzq6PhrjzWdV8uqMxmseyrk/qL02Zp2F7plrdrImisaijZBuKXmqFDcdjbb2jQza+97aN50vcjac2y2qm4XXXHBwFAL5Qgcu1/Ebsn39xeM/IoDLpYzAHMUFPhgq+29tPklC1TKXqRw6YIhN6sv8XjJSlbEXbNS4tcb645tc1bt9WUxyJzddGG/asnn/eISjieYmmmKKmh3u+xOwN/XxUQqoONe470Cwo8bFAq1j39LR8MbTi6znx/e43FsiiPXNL4b2UhgnM6hiRheS8ITw9upA+apHBzFy8GpE1Mxu+Lji9EX5pbh6RQ/hu+v+OF74vhAIZ7G//47/osc/g8ZFKDE3XsgIwAAAABJRU5ErkJggg=='
  };

  function supportedLanguage(value) {
    const language = String(value || "").toLowerCase().split(/[-_]/)[0];
    return Object.hasOwn(SOURCE_LABELS, language) ? language : "en";
  }

  function create({ sourceUrl = "" } = {}) {
    let host = document.getElementById(HOST_ID);
    if (!host) {
      host = document.createElement("div");
      host.id = HOST_ID;
      host.style.cssText = "all:initial;position:fixed;inset:0 0 auto 0;z-index:2147483647;pointer-events:none;font:13px/1.3 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
      const shadow = host.attachShadow({ mode:"open" });
      shadow.innerHTML = `
        <style>
          :host {
            all: initial;
            color-scheme: light dark;
            font: 13px/1.3 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
            --bar: #3c3c3c;
            --window: #3c3c3c;
            --surface: #545454;
            --segment: #585858;
            --surface-hover: #5c5c5c;
            --surface-active: #626262;
            --border: #666666;
            --text: #f4f4f4;
            --muted: #b5b5b5;
            --faint: #8f8f8f;
            --link: #78a5ff;
            --auto-send-brand: #a5a9ff;
          }
          @media (prefers-color-scheme: light) {
            :host {
              color-scheme: light;
              --bar: #f6f8fc;
              --window: #ffffff;
              --surface: #f6f8fc;
              --segment: #e8edf4;
              --surface-hover: #edf2f8;
              --surface-active: #ffffff;
              --border: #d8e0eb;
              --text: #253348;
              --muted: #687990;
              --faint: #8795a8;
              --link: #4d6bb8;
              --auto-send-brand: #4f46e5;
            }
          }
          *, *::before, *::after { box-sizing: border-box; }
          button, a { font: inherit; }
          .bar {
            position: relative;
            z-index: 2;
            height: 29px;
            padding: 1px 8px;
            color: var(--text);
            background: var(--bar);
            pointer-events: auto;
          }
          .bar::before {
            position: absolute;
            z-index: 3;
            top: 100%;
            right: 0;
            left: 0;
            height: 41px;
            background: var(--bar);
            content: "";
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
          .bar.is-expanded::before { opacity: 1; visibility: visible; }
          .bar::after {
            position: absolute;
            z-index: 5;
            top: 70px;
            right: 0;
            left: 0;
            height: 1px;
            background: var(--border);
            content: "";
            pointer-events: none;
          }
          .bar:not(.is-expanded)::after { top: auto; bottom: 0; }
          .source-row {
            display: flex;
            align-items: center;
            gap: 7px;
            height: 27px;
            min-width: 0;
          }
          .label {
            flex: 0 0 auto;
            color: var(--muted);
            font-size: 11px;
            font-weight: 650;
          }
          .source-link {
            display: block;
            flex: 1 1 auto;
            min-width: 0;
            overflow: hidden;
            color: var(--link);
            font-size: 12px;
            font-weight: 550;
            text-overflow: ellipsis;
            white-space: nowrap;
            text-decoration: none;
          }
          .source-link:hover { text-decoration: underline; text-underline-offset: 2px; }
          .empty-source { color: var(--muted); opacity: .58; font-size: 11px; font-style: italic; }
          .auto-send {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            gap: 4px;
            height: 25px;
            padding: 0 6px;
            border: 1px solid transparent;
            border-radius: 6px;
            color: var(--muted);
            background: var(--bar);
            font: inherit;
            font-size: 10px;
            font-weight: 650;
            white-space: nowrap;
            cursor: pointer;
          }
          .auto-send:hover { border-color: var(--border); background: var(--surface-hover); color: var(--text); }
          .auto-send.is-enabled { border-color: transparent; background: var(--bar); color: var(--auto-send-brand); }
          .auto-send.is-enabled:hover { border-color: var(--border); background: var(--surface-hover); color: var(--auto-send-brand); }
          .auto-send:disabled { opacity: .65; cursor: wait; }
          .auto-send svg { flex: 0 0 12.8px; width: 12.8px; height: 12.8px; }
          .chevron {
            display: grid;
            flex: 0 0 25px;
            place-items: center;
            width: 25px;
            height: 25px;
            margin-left: auto;
            padding: 0;
            border: 1px solid transparent;
            border-radius: 6px;
            color: var(--muted);
            background: transparent;
            cursor: pointer;
          }
          .chevron:hover { border-color: var(--border); background: var(--surface-hover); color: var(--text); }
          .auto-send:focus-visible, .chevron:focus-visible, .tab:focus-visible, .source-link:focus-visible {
            outline: 2px solid var(--link);
            outline-offset: 2px;
          }
          .chevron svg { width: 14px; height: 14px; transition: transform .16s ease; }
          .bar.is-expanded .chevron svg { transform: rotate(180deg); }
          .chevron-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
          .tabs {
            position: absolute;
            z-index: 4;
            top: 100%;
            left: 8px;
            right: 8px;
            display: flex;
            gap: 4px;
            height: 36px;
            padding: 3px;
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 13px;
            background: var(--segment);
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(-3px);
            transition: opacity .14s ease, transform .14s ease, visibility 0s linear .14s;
          }
          .bar.is-expanded .tabs {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
            transition: opacity .14s ease, transform .14s ease, visibility 0s;
          }
          .tab {
            display: flex;
            flex: 1 1 0;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-width: 0;
            padding: 0 5px;
            border: 1px solid transparent;
            border-radius: 6px;
            color: var(--muted);
            background: transparent;
            font: inherit;
            font-size: 10px;
            font-weight: 560;
            white-space: nowrap;
            cursor: pointer;
          }
          .tab:hover { color: var(--text); background: var(--surface-hover); }
          .tab[aria-selected="true"] {
            border-color: var(--border);
            color: var(--text);
            background: var(--surface-active);
            font-weight: 700;
          }
          .provider-icon-wrap {
            position: relative;
            display: grid;
            flex: 0 0 14px;
            place-items: center;
            width: 14px;
            height: 14px;
          }
          .provider-icon {
            display: block;
            width: 14px;
            height: 14px;
            object-fit: contain;
            border-radius: 4px;
          }
          .provider-icon-fallback {
            display: grid;
            place-items: center;
            width: 14px;
            height: 14px;
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text);
            background: var(--surface-hover);
            font-size: 8px;
            font-weight: 750;
          }
          .provider-icon[hidden], .provider-icon-fallback[hidden], .empty-source[hidden], .source-link[hidden] { display: none; }
          .blank-panel {
            position: fixed;
            z-index: 1;
            inset: 70px 0 0;
            display: none;
            color: var(--text);
            background: var(--window);
            pointer-events: auto;
          }
          @media (max-width: 520px) {
            .tab { gap: 3px; padding-inline: 2px; font-size: 9px; }
            .provider-icon-wrap, .provider-icon, .provider-icon-fallback { flex-basis: 13px; width: 13px; height: 13px; }
          }
          @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: .01ms !important; } }
        </style>
        <div class="bar is-expanded">
          <div class="source-row" role="region"><span class="label"></span><a class="source-link" target="_blank" rel="noopener noreferrer" hidden></a><span class="empty-source" hidden></span><button class="auto-send" type="button" aria-pressed="false" aria-label="Tự động gửi đang tắt" title="Tự động gửi đang tắt" disabled><span class="auto-send-label">Tự động gửi</span><svg xmlns="http://www.w3.org/2000/svg" width="12.8" height="12.8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap" aria-hidden="true"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/></svg></button><button class="chevron" type="button" aria-expanded="true" aria-controls="tabs" title="Hiện/ẩn hàng AI"><span class="chevron-label">Hiện/ẩn hàng AI</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
          <div class="tabs" id="tabs" role="tablist" aria-label="Các AI" aria-hidden="false">
            <button class="tab" type="button" role="tab" data-provider="chatgpt" aria-selected="true"><span class="provider-icon-wrap" aria-hidden="true"><img class="provider-icon" alt="" hidden><span class="provider-icon-fallback">C</span></span><span class="tab-label">ChatGPT</span></button>
            <button class="tab" type="button" role="tab" data-provider="gemini" aria-selected="false"><span class="provider-icon-wrap" aria-hidden="true"><img class="provider-icon" alt="" hidden><span class="provider-icon-fallback">G</span></span><span class="tab-label">Gemini</span></button>
            <button class="tab" type="button" role="tab" data-provider="claude" aria-selected="false"><span class="provider-icon-wrap" aria-hidden="true"><img class="provider-icon" alt="" hidden><span class="provider-icon-fallback">C</span></span><span class="tab-label">Claude</span></button>
            <button class="tab" type="button" role="tab" data-provider="grok" aria-selected="false"><span class="provider-icon-wrap" aria-hidden="true"><img class="provider-icon" alt="" hidden><span class="provider-icon-fallback">G</span></span><span class="tab-label">Grok</span></button>
          </div>
        </div>
        <div class="blank-panel" role="tabpanel" aria-label="AI panel"></div>`;
      document.documentElement.append(host);
    }

    const shadow = host.shadowRoot;
    const bar = shadow.querySelector(".bar");
    const sourceRow = shadow.querySelector(".source-row");
    const sourceLabel = shadow.querySelector(".label");
    const tabs = shadow.querySelector(".tabs");
    const sourceLink = shadow.querySelector(".source-link");
    const emptySource = shadow.querySelector(".empty-source");
    const blankPanel = shadow.querySelector(".blank-panel");
    const chevron = shadow.querySelector(".chevron");
    const autoSendButton = shadow.querySelector(".auto-send");
    const autoSendLabel = shadow.querySelector(".auto-send-label");
    const providerButtons = [...shadow.querySelectorAll("[data-provider]")];
    let currentSourceUrl = "";
    let selectedProvider = "chatgpt";
    let expanded = true;
    let autoSendEnabled = false;
    let uiLanguage = supportedLanguage(globalThis.browser?.i18n?.getUILanguage?.());

    function setSourceUrl(value) {
      try {
        const parsed = new URL(String(value || ""));
        currentSourceUrl = ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
      } catch { currentSourceUrl = ""; }
      if (currentSourceUrl) {
        const parsed = new URL(currentSourceUrl);
        sourceLink.href = currentSourceUrl;
        sourceLink.title = currentSourceUrl;
        sourceLink.textContent = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
        sourceLink.hidden = false;
        emptySource.hidden = true;
      } else {
        sourceLink.removeAttribute("href");
        sourceLink.textContent = "";
        sourceLink.hidden = true;
        emptySource.textContent = "";
        emptySource.hidden = false;
      }
    }

    function renderProvider() {
      for (const button of providerButtons) {
        const selected = button.dataset.provider === selectedProvider;
        button.setAttribute("aria-selected", String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      blankPanel.style.display = selectedProvider === "chatgpt" ? "none" : "block";
      blankPanel.setAttribute("aria-label", `${PROVIDER_NAMES[selectedProvider]} ${PANEL_LABELS[uiLanguage]}`);
    }

    function renderAutoSend() {
      const stateLabel = AUTO_SEND_STATUS_LABELS[uiLanguage][autoSendEnabled ? "on" : "off"];
      autoSendButton.classList.toggle("is-enabled", autoSendEnabled);
      autoSendButton.setAttribute("aria-pressed", String(autoSendEnabled));
      autoSendButton.setAttribute("aria-label", stateLabel);
      autoSendButton.title = stateLabel;
      autoSendLabel.textContent = AUTO_SEND_LABELS[uiLanguage];
    }

    function renderExpansion() {
      bar.classList.toggle("is-expanded", expanded);
      chevron.setAttribute("aria-expanded", String(expanded));
      chevron.setAttribute("aria-label", CHEVRON_LABELS[uiLanguage]);
      chevron.title = CHEVRON_LABELS[uiLanguage];
      tabs.setAttribute("aria-hidden", String(!expanded));
      tabs.inert = !expanded;
    }

    function setProvider(provider) {
      if (!PROVIDERS.includes(provider)) return;
      selectedProvider = provider;
      renderProvider();
    }

    function showFallbackIcon(button) {
      const image = button.querySelector(".provider-icon");
      const fallback = button.querySelector(".provider-icon-fallback");
      const data = PROVIDER_ICON_DATA[button.dataset.provider];
      if (!image || !fallback || !data) return;
      image.hidden = true;
      fallback.hidden = false;
      image.addEventListener("load", () => {
        if (!image.naturalWidth) return;
        image.hidden = false;
        fallback.hidden = true;
      }, { once:true });
      image.addEventListener("error", () => { image.hidden = true; fallback.hidden = false; }, { once:true });
      image.src = data;
    }

    function loadProviderIcons() {
      for (const button of providerButtons) {
        const image = button.querySelector(".provider-icon");
        const fallback = button.querySelector(".provider-icon-fallback");
        const site = PROVIDER_SITES[button.dataset.provider];
        const iconModule = globalThis.LHN_SITE_ICONS;
        if (iconModule?.load) {
          try {
            Promise.resolve(iconModule.load(image, site, { fallbackElement:fallback }))
              .then(iconUrl => { if (!iconUrl) showFallbackIcon(button); })
              .catch(() => showFallbackIcon(button));
          } catch { showFallbackIcon(button); }
        } else {
          showFallbackIcon(button);
        }
      }
    }

    autoSendButton.addEventListener("click", async () => {
      if (autoSendButton.disabled) return;
      const nextValue = !autoSendEnabled;
      autoSendButton.disabled = true;
      try {
        const storage = globalThis.browser?.storage?.local;
        if (!storage?.get || !storage?.set) throw new Error("Settings storage is unavailable");
        const stored = await storage.get(UI_LANGUAGE_KEY);
        const previous = stored?.[UI_LANGUAGE_KEY];
        const settings = previous && typeof previous === "object" && !Array.isArray(previous) ? { ...previous } : {};
        settings.chatGPTAutoSend = nextValue;
        await storage.set({ [UI_LANGUAGE_KEY]:settings });
        autoSendEnabled = nextValue;
      } catch {}
      autoSendButton.disabled = false;
      renderAutoSend();
    });

    chevron.addEventListener("click", () => {
      expanded = !expanded;
      renderExpansion();
    });
    for (const button of providerButtons) {
      button.addEventListener("click", () => setProvider(button.dataset.provider));
      button.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = providerButtons.indexOf(button);
        const next = event.key === "Home" ? 0 : event.key === "End" ? providerButtons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + providerButtons.length) % providerButtons.length;
        providerButtons[next].focus();
        setProvider(providerButtons[next].dataset.provider);
      });
    }

    void (async () => {
      try {
        const stored = await globalThis.browser?.storage?.local?.get?.(UI_LANGUAGE_KEY);
        const settings = stored?.[UI_LANGUAGE_KEY] || {};
        uiLanguage = supportedLanguage(settings.language || uiLanguage);
        autoSendEnabled = settings.chatGPTAutoSend === true;
      } catch {}
      sourceLabel.textContent = SOURCE_LABELS[uiLanguage];
      sourceLabel.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      sourceRow.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      tabs.setAttribute("aria-label", TABS_LABELS[uiLanguage]);
      autoSendButton.disabled = false;
      renderAutoSend();
      renderExpansion();
      renderProvider();
    })();
    globalThis.browser?.storage?.onChanged?.addListener?.((changes, areaName) => {
      if (areaName !== "local" || !changes?.[UI_LANGUAGE_KEY]) return;
      const settings = changes[UI_LANGUAGE_KEY].newValue || {};
      uiLanguage = supportedLanguage(settings.language || uiLanguage);
      autoSendEnabled = settings.chatGPTAutoSend === true;
      sourceLabel.textContent = SOURCE_LABELS[uiLanguage];
      sourceLabel.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      sourceRow.setAttribute("aria-label", SOURCE_LABELS[uiLanguage]);
      tabs.setAttribute("aria-label", TABS_LABELS[uiLanguage]);
      renderAutoSend();
      renderExpansion();
      renderProvider();
    });

    setSourceUrl(sourceUrl);
    renderExpansion();
    renderProvider();
    loadProviderIcons();
    return Object.freeze({ setSourceUrl, setProvider, getProvider:() => selectedProvider });
  }

  globalThis.LHN_CHATGPT_AI_TOOLBAR = Object.freeze({ create });
})();
