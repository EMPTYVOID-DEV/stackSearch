import { Browser, ElementHandle, Page } from "puppeteer";
const proxyChain = require("proxy-chain");
const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

async function handleAsync<T>(promise: Promise<T>): Promise<[T | null, any]> {
  try {
    let data = await promise;
    return [data, null];
  } catch (error) {
    console.log(error);
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

async function enterNavigate(page) {
  let keyboard = page.keyboard;
  return await Promise.all([
    handleAsync(keyboard.press("Enter")),
    page.waitForNavigation(),
  ]);
}

async function proxyConnection(): Promise<[Browser, string]> {
  const exposedProxyUrl = `http://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_URL}`;
  const secureProxyUrl = await proxyChain.anonymizeProxy(exposedProxyUrl);
  let browser: Browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.LOCAL_BROWSER_PATH,
    //args: [`--proxy-server=${secureProxyUrl}`],
  });
  return [browser, secureProxyUrl];
}

async function main() {
  const [browser, secureProxyUrl] = await proxyConnection();
  const page = await browser.newPage();
  await page.goto("https://google.com/");
  await typeField(page, "#APjFqb", "sveltekit and fastapi serve");
  await enterNavigate(page);
  let answerLink = await page.$x(
    '//span[@class="VuuXrf" and text()="Stack Overflow"]'
  )[0];
  await clickNavigate(page, answerLink);
  await timeout(1000);
  await page.screenshot({
    path: "./img.jpg",
  });
  await timeout(8000);
  await browser.close();
  await proxyChain.closeAnonymizedProxy(secureProxyUrl, true);
}

puppeteer.use(stealthPlugin());

main();
