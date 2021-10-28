import puppeteer, { Page } from 'puppeteer';
import dappeteer from '@chainsafe/dappeteer';
import fs from 'fs';

const collectionName = "Your Collection Name"

const collectionURL = `https://opensea.io/${collectionName}/asset/create`

const openseaDescription = `Your description here`

const lockedContent = `Locked content text here`

const secretPhase = `here is your secret phase dont share it`

const connectWallet = async (page: Page, metamask) => {
  const button = await page.$('button.dBFmez:first-child');
  await button.click();

  await metamask.approve();

  return;
}

const uploadImage = async (page: Page, file: string) => {
  const elementHandle = await page.$("#media");
  await elementHandle.uploadFile(`images/${file}`);

  return;
}

const pageTimeout = async (number: number, page: Page) => {
  await page.waitForTimeout(number)
  return;
}

const fillFields = async (page: Page, fileName: string) => {
  await page.focus('#name')
  await page.keyboard.type(fileName)

  await pageTimeout(1000, page)
  
  await page.$eval('#description', (el, value) => el.value = value, openseaDescription);
  await page.focus('#description')
  await page.keyboard.type(' ')

  await pageTimeout(1000, page)

  await page.evaluate(() => {
    document.querySelector("#unlockable-content-toggle").parentElement.click();
  });

  await pageTimeout(1000, page)

  await page.$eval('textarea[placeholder="Enter content (access key, code to redeem, link to a file, etc.)"]', (el, value) => el.value = value, lockedContent);
  await page.focus('textarea[placeholder="Enter content (access key, code to redeem, link to a file, etc.)"]')
  await page.keyboard.type(' ')
  
  const input = await page.$("#chain")
  input.click()

  await pageTimeout(1000, page)

  await page.click('img[src="/static/images/logos/polygon.svg"]')

  return;
}

(async () => {
  const browser = await dappeteer.launch(puppeteer, { metamaskVersion: 'v10.1.1' });
  const metamask = await dappeteer.setupMetamask(browser, { seed: secretPhase});
  const files = await fs.promises.readdir("images/");
  files.shift()

  const page = await browser.newPage();
  await page.goto(collectionURL);
  
  const firstTabs = await browser.pages()
  await firstTabs[0].close()

  await pageTimeout(2000, page)

  await connectWallet(page, metamask)

  for (let i = 0; i <= files.length ; i++) {
    const tabs = await browser.pages()
    const data = {
      name: `Your collection name here #${1 + i}`,
    }

    if(i === 0) {
      await tabs[1].bringToFront()
      await tabs[1].goto(collectionURL)

      await pageTimeout(2000, page)

      await metamask.sign()
      await metamask.page.waitForTimeout(2000)
    }

    if(i === 0) {
      await tabs[1].bringToFront()
      await tabs[1].goto(collectionURL)
    } else {
      await tabs[1].bringToFront()
      await tabs[1].goto(collectionURL)
    }

    await pageTimeout(2000, page)

    await uploadImage(page, files[i]);
    await fillFields(page, data.name);

    const button = await page.$('.AssetForm--action button');
    await button.click()
    
    await pageTimeout(4000, page)

    fs.renameSync(`images/${files[i]}`, `images/completed-${files[i]}`)

    console.log({ message: `Mint the NFT: ${data.name}`, fileName: files[i]})
    console.log(`Mint the NFT: ${data.name}`)
  }

  console.log('Minted all NFTs with success')
})();