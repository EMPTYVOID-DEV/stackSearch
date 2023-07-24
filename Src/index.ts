import { Browser, ElementHandle, Page } from "puppeteer";
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

type error =
  | "Never been asked before on stackoverflow"
  | "Hasn't been answered yet in stackoverflow"
  | "Your network is slow";

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

async function clickNavigate(
  page: Page,
  selector: string | ElementHandle
): Promise<null | resualt> {
  let navPromise = null;
  if (typeof selector == "string") {
    navPromise = Promise.all([
      handleAsync(page.click(selector)),
      page.waitForNavigation(),
    ]);
  } else {
    navPromise = Promise.all([
      handleAsync(selector.click()),
      page.waitForNavigation(),
    ]);
  }
  try {
    await navPromise;
    return null;
  } catch (error) {
    return { type: 1, data: "Your network is slow" };
  }
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

async function enterNavigate(page: Page): Promise<null | resualt> {
  let keyboard = page.keyboard;
  let navPromise = Promise.all([
    handleAsync(keyboard.press("Enter")),
    page.waitForNavigation(),
  ]);
  try {
    await navPromise;
    return null;
  } catch (error) {
    return { type: 1, data: "Your network is slow" };
  }
}

async function proxyConnection(withProxy: boolean): Promise<[Browser, string]> {
  if (withProxy) {
    const exposedProxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_URL}`;
    const secureProxyUrl = await proxyChain.anonymizeProxy(exposedProxyUrl);
    let browser: Browser = await puppeteer.launch({
      headless: false,
      executablePath: process.env.LOCAL_BROWSER_PATH,
      args: [`--proxy-server=${secureProxyUrl}`],
    });
    return [browser, secureProxyUrl];
  }
  let browser: Browser = await puppeteer.launch({
    headless: false,
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
  page.setDefaultNavigationTimeout(45000);
  await page.goto("https://google.com/");
  await typeField(page, "#APjFqb", questionQuery + " stackoverflow");
  let resualt = await enterNavigate(page);
  if (resualt != null) {
    return resualt;
  }
  const anchor = await page.$(
    '#search .MjjYud .yuRUbf a[href^="https://stackoverflow.com/"]'
  );
  if (!anchor)
    return {
      type: 1,
      data: "Never been asked before on stackoverflow",
    };
  let resualt2 = await clickNavigate(page, anchor);
  if (resualt2 != null) {
    return resualt2;
  }
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
  await proxyChain.closeAnonymizedProxy(secureProxyUrl, true);
  return { type: 0, data: answers };
}
