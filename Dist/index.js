import proxyChain from "proxy-chain";
import puppeteer from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: path.join(__dirname, "../.env"),
});
puppeteer.use(stealthPlugin());
async function handleAsync(promise) {
  try {
    let data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error];
  }
}
async function timeout(delay) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(true);
    }, delay);
  });
}
async function clickNavigate(page, selector) {
  if (typeof selector == "string") {
    return Promise.all([
      handleAsync(page.click(selector)),
      page.waitForNavigation(),
    ]);
  }
  return Promise.all([handleAsync(selector.click()), page.waitForNavigation()]);
}
async function typeField(page, selector, message) {
  let [input, error2] = await handleAsync(page.$(selector));
  return await handleAsync(input.type(message, { delay: 140 }));
}
async function randomClicks(page) {
  let randomElement = await page.evaluateHandle(() => {
    let elementList = document.querySelectorAll("h1,h2,h3,h4,h5,h6,p");
    let randomIndex = Math.floor(Math.random() * (elementList.length - 1));
    return elementList[randomIndex];
  });
  return await handleAsync(
    randomElement.click({
      delay: 100,
      count: 3,
    })
  );
}
async function enterNavigate(page) {
  let keyboard = page.keyboard;
  return await Promise.all([
    handleAsync(keyboard.press("Enter")),
    page.waitForNavigation(),
  ]);
}
async function proxyConnection(withProxy) {
  if (withProxy) {
    const exposedProxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_URL}`;
    const secureProxyUrl = await proxyChain.anonymizeProxy(exposedProxyUrl);
    let browser = await puppeteer.launch({
      headless: "old",
      executablePath: process.env.LOCAL_BROWSER_PATH,
      args: [`--proxy-server=${secureProxyUrl}`],
    });
    return [browser, secureProxyUrl];
  }
  let browser = await puppeteer.launch({
    headless: "old",
    executablePath: process.env.LOCAL_BROWSER_PATH,
  });
  return [browser, ""];
}
export async function main(questionQuery, withProxy) {
  const [browser, secureProxyUrl] = await proxyConnection(withProxy);
  const page = await browser.newPage();
  await page.goto("https://google.com/");
  await typeField(page, "#APjFqb", questionQuery + " stackoverflow");
  await enterNavigate(page);
  const anchor = await page.$(
    '.MjjYud > .g.Ww4FFb > .kvH3mc > .jGGQ5e a[href^="https://stackoverflow.com/"]'
  );
  if (!anchor)
    return {
      type: 1,
      data: "Never been asked before on stackoverflow",
    };
  await clickNavigate(page, anchor);
  await timeout(2000);
  await randomClicks(page);
  const answersBlock = await page.$("#answers");
  if (!answersBlock)
    return {
      type: 1,
      data: "Hasn't been answered yet in stackoverflow",
    };
  const [answers] = await handleAsync(
    answersBlock.$$eval(
      'div.answer[id^="answer-"] .answercell.post-layout--right > .s-prose.js-post-body',
      (elementList) => {
        const answersList = elementList.map((el) => el.innerText);
        return answersList;
      }
    )
  );
  await browser.close();
  withProxy && (await proxyChain.closeAnonymizedProxy(secureProxyUrl, true));
  return { type: 0, data: answers };
}
main("statically server react app from fastapi", false);
