import { Browser, ElementHandle, Page } from "puppeteer";
import proxyChain from "proxy-chain";
import puppeteer from "C:/Users/hp/Documents/study/Projects/stack-search/node_modules/puppeteer-extra/dist/index.esm.js";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

puppeteer.use(stealthPlugin());

type error =
  | "Never been asked before on stackoverflow"
  | "Hasn't been answered yet in stackoverflow"
  | "The bot has been blocked";

type resualt = {
  type: 0 | 1;
  data: string[] | error;
};

async function handleAsync<T>(promise: Promise<T>): Promise<[T | null, any]> {
  try {
    let data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error];
  }
}

async function timeout(delay: number) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(true);
    }, delay);
  });
}

async function clickNavigate(page: Page, selector: string | ElementHandle) {
  if (typeof selector == "string") {
    return Promise.all([
      handleAsync(page.click(selector)),
      page.waitForNavigation(),
    ]);
  }
  return Promise.all([handleAsync(selector.click()), page.waitForNavigation()]);
}

async function typeField(page: Page, selector: string, message: string) {
  let [input, error2] = await handleAsync<ElementHandle>(page.$(selector));
  return await handleAsync(input.type(message, { delay: 140 }));
}

async function randomClicks(page: Page) {
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

async function enterNavigate(page: Page) {
  let keyboard = page.keyboard;
  return await Promise.all([
    handleAsync(keyboard.press("Enter")),
    page.waitForNavigation(),
  ]);
}

async function proxyConnection(withProxy: boolean): Promise<[Browser, string]> {
  if (withProxy) {
    const exposedProxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_URL}`;
    const secureProxyUrl = await proxyChain.anonymizeProxy(exposedProxyUrl);
    let browser: Browser = await puppeteer.launch({
      headless: "old",
      executablePath: process.env.LOCAL_BROWSER_PATH,
      args: [`--proxy-server=${secureProxyUrl}`],
    });
    return [browser, secureProxyUrl];
  }
  let browser: Browser = await puppeteer.launch({
    headless: "old",
    executablePath: process.env.LOCAL_BROWSER_PATH,
  });
  return [browser, ""];
}

export async function main(
  questionQuery: string,
  withProxy: boolean
): Promise<resualt> {
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
  const [answers] = await handleAsync<string[]>(
    answersBlock.$$eval(
      'div.answer[id^="answer-"] .answercell.post-layout--right > .s-prose.js-post-body',
      (elementList) => {
        const answersList = elementList.map(
          (el) => (el as HTMLElement).innerText
        );
        return answersList;
      }
    )
  );
  await browser.close();
  withProxy && (await proxyChain.closeAnonymizedProxy(secureProxyUrl, true));
  return { type: 0, data: answers };
}
main("statically server react app from fastapi", false);
