/* Shared Login popup (#profileAuthDialog): Dashboard now; the in-page bar popup reuses markup().
   attach(dialog, { dark, coarse }) → { sync, close, morph }: theme/touch classes, drag-down to close and no page scroll behind
   (js/shared/sheet-kit.js, like the Settings sheet), keeps the sheet above the on-screen keyboard.
   check(): the local mock sign-in check moved from dashboard.js (nothing is sent anywhere). */
(() => {
  if (globalThis.LHN_AUTH_POPUP) return;
  const PHONE = matchMedia("(orientation: portrait) and (max-width: 699px), (orientation: landscape) and (max-height: 499.98px)");   // sheet từ đáy: điện thoại dọc + ngang
  const GOOGLE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.7-5H1.3v3.2A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.2a7.2 7.2 0 0 1 0-4.4V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.2Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8L20 3.2A11.7 11.7 0 0 0 12 0 12 12 0 0 0 1.2 6.6l4.1 3.2c1-2.9 3.6-5 6.7-5Z"/></svg>';
  // cùng markup với pages/dashboard.html (#profileAuthDialog) — trang web dựng bằng hàm này trong shadow DOM
  function markup(t) {
    return `<form id="profileAuthForm" method="dialog"><span class="profile-auth-grip" aria-hidden="true"></span>
    <div class="profile-auth-body">
      <div class="profile-auth-side">
        <div class="profile-auth-seg" role="tablist"><button id="profileLoginTab" type="button" role="tab" class="is-active">${t("profileLogin")}</button><button id="profileRegisterTab" type="button" role="tab">${t("profileRegister")}</button></div>
        <button id="profileGoogleLogin" class="profile-google-button" type="button">${GOOGLE}<span>${t("profileGoogleContinue")}</span></button>
      </div>
      <div class="profile-auth-divider"><span>${t("profileOrEmail")}</span></div>
      <div class="profile-auth-fields">
        <label><span>${t("profileUsername")}</span><input id="profileUsername" type="text" placeholder="${t("profileUsernamePlaceholder")}" autocomplete="email" required></label>
        <label><span>${t("profilePassword")}</span><input id="profilePassword" type="password" placeholder="${t("profilePasswordPlaceholder")}" autocomplete="current-password" required></label>
        <label id="profileRetypePasswordLabel" hidden><span>${t("profileRetypePassword")}</span><input id="profileRetypePassword" type="password" placeholder="${t("profileRetypePassword")}" autocomplete="new-password"></label>
        <p id="profileAuthError" class="profile-auth-error" role="status" hidden></p>
        <button id="profileAuthSubmit" class="profile-auth-submit" type="submit">${t("profileLoginNow")}</button>
      </div>
      <p class="profile-auth-switch is-login">${t("profileNoAccount")} <button id="profileSwitchRegister" type="button">${t("profileRegister")}</button></p>
      <p class="profile-auth-switch is-register">${t("profileHaveAccount")} <button id="profileSwitchLogin" type="button">${t("profileLogin")}</button></p>
    </div></form>`;
  }
  // kiểm tra mô phỏng (chuyển nguyên từ dashboard.js) → { profile } hoặc { error: khoá nhãn }
  function check(mode, username, password, retype) {
    username = String(username || "").trim();
    if (mode === "google") return { profile:{ username:"huson", email:"huuson889@gmail.com", displayName:"Huson", createdAt:Date.now() } };
    if (mode === "login") {
      if (!["huson", "huson@example.com"].includes(username.toLocaleLowerCase()) || password !== "123") return { error:"profileBadCredentials" };
      return { profile:{ username:username.includes("@") ? username.split("@")[0] : "huson", email:username.includes("@") ? username : "huuson889@gmail.com", displayName:"Huson", createdAt:Date.now() } };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username) || String(password || "").length < 1) return { error:"profileNeedFields" };
    if (password !== retype) return { error:"profilePasswordMismatch" };
    const displayName = username.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase());
    return { profile:{ username:username.split("@")[0], email:username, displayName, createdAt:Date.now() } };
  }
  function attach(dialog, opts = {}) {
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
  globalThis.LHN_AUTH_POPUP = Object.freeze({ attach, check, markup, PHONE });
})();
