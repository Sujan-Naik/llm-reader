import './index.css';

window.addEventListener('DOMContentLoaded', () => {
  const queryForm = document.getElementById('llm-query-form') as HTMLFormElement;
  const queryResponse = document.getElementById('llm-query-response') as HTMLTextAreaElement;

  queryForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const req =  (document.getElementById("llm-query") as HTMLInputElement).value; // or grab from the input: (document.getElementById("llm-query") as HTMLInputElement).value
    const response = await window.llm.query(req);
    queryResponse.value = response;
    console.log(response);
  });

  window.electronAPI.onClipboardText((text: string) => {
  const display = document.getElementById('clipboard-display');
  if (display) {
    display.textContent = text || '(empty clipboard)';
  }
});

  document.body.addEventListener('mouseenter', () => {
  window.windowControl.setIgnoreMouseEvents(false);
});

document.body.addEventListener('mouseleave', () => {
  window.windowControl.setIgnoreMouseEvents(true);
});

});


