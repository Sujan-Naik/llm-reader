/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import {ipcRenderer} from "electron";

console.log(
  '👋 This message is being logged by "renderer.ts", included via Vite',
);
//
// const func = async () => {
//   const response = await window.versions.ping()
//   console.log(response) // prints out 'pong'
// }
//
// func()

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
});

// document.body.addEventListener('mouseenter', () => {
//   window.windowControl.setIgnoreMouseEvents(false);
// });
//
// document.body.addEventListener('mouseleave', () => {
//   window.windowControl.setIgnoreMouseEvents(true);
// });
//
