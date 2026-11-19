/* Shared Login popup (#profileAuthDialog): Dashboard now; the in-page bar popup reuses markup().
   attach(dialog, { dark, coarse }) → { sync, close, morph }: theme/touch classes, drag-down to close and no page scroll behind
   (js/shared/sheet-kit.js, like the Settings sheet), keeps the sheet above the on-screen keyboard.
   check(): the local mock sign-in check moved from dashboard.js (nothing is sent anywhere). */
(() => {
  if (globalThis.LHN_AUTH_POPUP) return;
  const PHONE = matchMedia("(orientation: portrait) and (max-width: 699px), (orientation: landscape) and (max-height: 499.98px)");   // sheet từ đáy: điện thoại dọc + ngang
  const EYE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="2.9"/><path class="kp-eye-slash" d="M4 4l16 16"/></svg>';
  const GOOGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.7-5H1.3v3.2A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.2a7.2 7.2 0 0 1 0-4.4V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.2Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A11.7 11.7 0 0 0 12 0 12 12 0 0 0 1.2 6.6l4.1 3.2c1-2.9 3.6-5 6.7-5Z"/></svg>';
  // cùng markup với pages/dashboard.html (#profileAuthDialog) — trang web dựng bằng hàm này trong shadow DOM
  function markup(t) {
    return `<form id="profileAuthForm" method="dialog" novalidate><span class="profile-auth-grip" aria-hidden="true"></span>
    <header class="profile-auth-head"><h2 id="profileAuthTitle" class="profile-auth-title">${t("profileLogin")}</h2></header>
    <div class="profile-auth-body">
      <div class="profile-auth-side">
        <button id="profileGoogleLogin" class="profile-google-button" type="button">${GOOGLE}<span>${t("profileGoogleContinue")}</span></button>
      </div>
      <div class="profile-auth-divider"><span>${t("profileOrEmail")}</span></div>
      <div class="profile-auth-fields">
        <label><span>${t("profileUsername")}</span><input id="profileUsername" type="text" placeholder="${t("profileUsernamePlaceholder")}" autocomplete="email" required></label>
        <label><span>${t("profilePassword")}</span><span class="profile-auth-pw"><input id="profilePassword" type="password" placeholder="${t("profilePasswordPlaceholder")}" autocomplete="current-password" required><button class="profile-auth-eye" type="button" data-password-toggle="profilePassword" aria-pressed="false" aria-label="${t("profileShowPassword")}" data-label-show="${t("profileShowPassword")}" data-label-hide="${t("profileHidePassword")}">${EYE}</button></span></label>
        <label id="profileRetypePasswordLabel" hidden><span>${t("profileRetypePassword")}</span><span class="profile-auth-pw"><input id="profileRetypePassword" type="password" placeholder="${t("profileRetypePassword")}" autocomplete="new-password"><button class="profile-auth-eye" type="button" data-password-toggle="profileRetypePassword" aria-pressed="false" aria-label="${t("profileShowPassword")}" data-label-show="${t("profileShowPassword")}" data-label-hide="${t("profileHidePassword")}">${EYE}</button></span></label>
        <p id="profileAuthError" class="profile-auth-error" role="status" hidden></p>
        <div id="profileTermsRow" class="profile-auth-terms" hidden>
          <input id="profileTerms" type="checkbox">
          <div class="profile-auth-terms-text"><label for="profileTerms">${t("profileTermsAgree")}</label> <button class="profile-auth-legal" type="button" data-legal="terms">${t("profileTermsLink")}</button> <span>${t("profileTermsAnd")}</span> <button class="profile-auth-legal" type="button" data-legal="privacy">${t("profilePrivacyLink")}</button></div>
        </div>
        <div id="profileLegalPanel" class="profile-auth-legal-panel" hidden>
          <strong id="profileLegalTitle"></strong>
          <p id="profileLegalBody"></p>
          <button id="profileLegalClose" type="button">${t("profileLegalClose")}</button>
        </div>
        <button id="profileAuthSubmit" class="profile-auth-submit" type="submit">${t("profileLoginNow")}</button>
      </div>
      <p class="profile-auth-switch is-login">${t("profileNoAccount")} <button id="profileSwitchRegister" type="button">${t("profileRegister")}</button></p>
      <p class="profile-auth-switch is-register">${t("profileHaveAccount")} <button id="profileSwitchLogin" type="button">${t("profileLogin")}</button></p>
    </div></form>`;
  }
  // kiểm tra mô phỏng (chuyển nguyên từ dashboard.js) → { profile } hoặc { error: khoá nhãn }
  const KNOWN = ["huson", "huson@example.com"];
  // định dạng email: có tên, có @, tên miền có dấu chấm, đuôi ≥ 2 chữ; không "..", không chấm ở đầu/cuối
  function validEmail(value) {
    const email = String(value || "").trim();
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(email)) return false;
    const local = email.split("@")[0];
    return !local.startsWith(".") && !local.endsWith(".") && !email.includes("..");
  }
  function accountExists(username) {
    return KNOWN.includes(String(username || "").trim().toLocaleLowerCase());
  }
  function check(mode, username, password, retype) {
    username = String(username || "").trim();
    if (mode === "google") return { profile:{ username:"huson", email:"huuson889@gmail.com", displayName:"Huson", createdAt:Date.now() } };
    if (!validEmail(username) && !accountExists(username)) return { error:"profileEmailInvalid" };
    if (mode === "login") {
      if (!accountExists(username) || password !== "123") return { error:"profileBadCredentials" };
      return { profile:{ username:username.includes("@") ? username.split("@")[0] : "huson", email:username.includes("@") ? username : "huuson889@gmail.com", displayName:"Huson", createdAt:Date.now() } };
    }
    if (String(password || "").length < 8) return { error:"profilePasswordShort" };
    if (password !== retype) return { error:"profilePasswordMismatch" };
    const displayName = username.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase());
    return { profile:{ username:username.split("@")[0], email:username, displayName, createdAt:Date.now() } };
  }
  function attach(dialog, opts = {}) {
    // con mắt hiện / ẩn mật khẩu
    dialog.querySelectorAll("[data-password-toggle]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        const input = dialog.querySelector("#" + button.dataset.passwordToggle);
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.setAttribute("aria-pressed", String(show));
        const label = button.dataset[show ? "labelHide" : "labelShow"];
        if (label) button.setAttribute("aria-label", label);
        input.focus({ preventScroll:true });
      });
    });
    // vuốt / chặn cuộn: dùng chung sheet-kit với sheet Cài đặt (js/shared/sheet-kit.js), gắn vào CHÍNH hộp thoại như #dashboardSettingsDialog —
    // điện thoại (dọc + ngang): hộp thoại là sheet, kéo lên / xuống y như Cài đặt, kéo xuống đủ xa = đóng; thẻ giữa màn hình: không kéo; luôn: trang phía sau không cuộn
    let kitted = false;
    const kit = () => {
      const SK = globalThis.LHN_SHEET; if (!SK || kitted) return; kitted = true;
      SK.attach(dialog, { isOpen:() => dialog.open, close:() => dialog.close(), watch:dialog, get drag() { return PHONE.matches ? undefined : false; } });
    };
    const sync = () => {
      dialog.classList.toggle("is-dark", !!opts.dark?.());
      dialog.classList.toggle("is-coarse", !!opts.coarse?.());
      kit();
    };
    // đóng: CSS tự trượt sheet xuống / mờ thẻ (như sheet Cài đặt) — không cần hẹn giờ
    function close() { if (dialog.open) dialog.close(); }
    // bàn phím ảo (điện thoại): sheet nâng lên ngay trên bàn phím (CSS cho chuyển động), cao tối đa 96% phần còn thấy
    const vv = globalThis.visualViewport;
    const kb = () => {
      if (!vv || !dialog.open) return; const h = Math.round(innerHeight - vv.height - vv.offsetTop);
      if (h > 80) { dialog.style.setProperty("--au-kb", h + "px"); dialog.style.setProperty("--au-max", Math.round(vv.height * .96) + "px"); }
      else { dialog.style.removeProperty("--au-kb"); dialog.style.removeProperty("--au-max"); }
    };
    vv?.addEventListener("resize", kb); vv?.addEventListener("scroll", kb);
    dialog.addEventListener("close", () => { dialog.style.removeProperty("--au-kb"); dialog.style.removeProperty("--au-max"); });
    // Đăng nhập ↔ Đăng ký: ô "Nhập lại mật khẩu" mở ra / thu lại mượt (cao + mờ dần), thẻ / sheet cao lên / thấp xuống theo — không nhảy
    function morph(change) {
      const label = dialog.querySelector("#profileRetypePasswordLabel");
      if (label?._au) { label._au.cancel(); if (label._auHide) label.hidden = true; label._au = null; label._auHide = false; }
      if (!dialog.open || !label || matchMedia("(prefers-reduced-motion: reduce)").matches) { change(); return; }
      const was = !label.hidden; change(); const now = !label.hidden;
      if (was === now) return;
      const gap = parseFloat(getComputedStyle(label.parentElement).rowGap) || 0, ease = "cubic-bezier(.2, .8, .2, 1)";
      if (!now) label.hidden = false;
      const h = label.offsetHeight, open = { height:h + "px", marginTop:"0px", opacity:1, overflow:"hidden" }, shut = { height:"0px", marginTop:-gap + "px", opacity:0, overflow:"hidden" };
      const anim = label.animate(now ? [shut, open] : [open, shut], { duration:240, easing:ease });
      label._au = anim; label._auHide = !now;
      anim.onfinish = () => { if (label._au !== anim) return; if (label._auHide) label.hidden = true; label._au = null; label._auHide = false; };
    }
    return { sync, close, morph };
  }
  globalThis.LHN_AUTH_POPUP = Object.freeze({ attach, check, markup, accountExists, validEmail, PHONE });
})();
