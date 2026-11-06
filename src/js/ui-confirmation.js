export function confirmer({titre, message ,details=""}) {
const dialog = document.getElementById("dialog-confirmation")

document.getElementById("confirmation-titre").textContent = titre;
document.getElementById("confirmation-message").textContent = message;
document.getElementById("confirmation-details").textContent = details;

return new Promise(resolve => {
  dialog.returnValue = "";
  dialog.addEventListener("close", () => {
    resolve(dialog.returnValue === "valider");
  }, { once: true });
  dialog.showModal();
});
}