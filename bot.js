const puppeteer = require("puppeteer");
const puppeteerExtra = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteerExtra.use(stealthPlugin());
require("dotenv").config();

// Get input from user
const args = process.argv.slice(2);
const YOUTUBE_URL = args[0] || process.env.YOUTUBE_URL;
const CHROME_PATH = args[1] || process.env.CHROME_PATH;
const PROFILE_PATH = args[2] || process.env.PROFILE_PATH;
const PROFILE_DIR = args[3] || process.env.PROFILE_DIR;
const BOT_DURATION = args[4] || 60; // 1 hour by default
const BOT_SEND_MSG_INTERVAL = args[5] || 60; // 1 min by default
const CUSTOM_MESSAGES = args[6] ? args[6].split("|") : null;

const startBot = async () => {
  try {
    console.log("Opening browser with existing profile...");

    const messages = CUSTOM_MESSAGES || [
      "Mujhe lagta hai ki imposter banna crewmate se zyada asaan hai...",
      "Jab imposter tumhe maar de aur tumhe pata hi na chale ki kisne kiya... Dard bhari baat hai, lekin relatable hai.",
      "Imposter banna ek toxic relationship jaise hai... Main tumhe maar deta hoon, aur tumhe kabhi pata nahi chalta.",
      "Mujhe yeh pasand hai jab crewmates kehte hain, 'Imposter ko pakad lenge,' aur usi waqt unhe piche se ghanti maar di jaati hai.",
      "Crewmates samajhte hain ki wo safe hain, lekin main bas sahi waqt ka intezaar kar raha hoon plug maarne ka.",
      "Apne best friend ko maar ke, aur phir doosre pe blame daalna... Yehi toh hai *Among Us* ki asli kala.",
      "Imposter logic: Unhe maaro, vent karo, aur phir sab kuch normal dikhane ka natak karo... Classic.",
      "Kya tumne kabhi *Among Us* mein kisi ko maara aur phir bas socha ki kya yeh kaam kar jayega? Bilkul wahi.",
      "Jab tum imposter ho aur pakad jaate ho, par phir bhi us bechare ko blame karte ho jo bas wires thik kar raha tha.",
      "Ab main imposter ko apne crewmates se zyada trust karta hoon... Kam se kam wo apne kaam ko imaandari se karte hain.",
    ];

    // Launch Puppeteer with a specific user data directory
    const browser = await puppeteer.launch({
      product: "chrome", // Change to "chrome" if using Google Chrome
      headless: false, // Run in visible mode
      executablePath: CHROME_PATH,
      args: [
        "--disable-web-security",
        "--allow-running-insecure-content",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--remote-debugging-port=9223",
        "--disable-infobars",
        "--start-maximized",
        "--disable-gpu",
        `--user-data-dir=${PROFILE_PATH}`,
        `--profile-directory=${PROFILE_DIR}`,
      ],
    });

    // Open a new page
    const page = await browser.newPage();
    console.log("Navigating to YouTube live stream...");

    // Navigate to the YouTube URL
    await page.goto(YOUTUBE_URL, { timeout: 60000 });

    // Play the video
    const playVideo = async () => {
      const playButtonSelector = ".ytp-play-button.ytp-button"; // Play button selector
      const playButton = await page.$(playButtonSelector);

      if (playButton) {
        const isPaused = await page.evaluate(
          (button) => button.getAttribute("aria-label") === "Play",
          playButton
        );

        if (isPaused) {
          console.log("Video is paused, playing the video...");
          await playButton.click(); // Click play if paused
        } else {
          console.log("Video is already playing.");
        }
      }
    };

    // Function to skip the ad if it appears
    const skipAd = async () => {
      const skipButtonSelector = ".videoAdUiSkipButton"; // Skip button selector for ads
      const skipButton = await page.$(skipButtonSelector);

      if (skipButton) {
        console.log("Ad detected, skipping...");
        await skipButton.click(); // Click skip if ad appears
      }
    };

    // Wait for the video to be loaded and play
    await playVideo();

    // Check for and skip ad if present
    await skipAd();

    // Wait for the live chat iframe to load
    console.log("Waiting for the live chat iframe...");
    const iframeSelector = "iframe#chatframe";
    await page.waitForSelector(iframeSelector);

    // Switch to the live chat iframe
    const chatFrame = await page.$(iframeSelector);
    const chatFrameContent = await chatFrame.contentFrame();

    // Wait for the chat input field
    const chatInputSelector = "#input.yt-live-chat-text-input-field-renderer";

    await chatFrameContent.waitForSelector(chatInputSelector);

    const sendMessage = async () => {
      // Pick a random message from the conversation list
      const message = messages[Math.floor(Math.random() * messages.length)];
      console.log("Posting message:", message);

      // Type the message in the input field
      await chatFrameContent.type(chatInputSelector, message);

      // Click the send button
      const sendButtonSelector = "#send-button button";
      await chatFrameContent.click(sendButtonSelector);

      console.log("Message posted successfully!");
    };

    // Start the message loop
    console.log("Starting the message loop...");
    const intervalId = setInterval(async () => {
      try {
        await sendMessage();
      } catch (error) {
        console.error("Error while sending message:", error);
        clearInterval(intervalId); // Stop the loop if an error occurs
      }
    }, BOT_SEND_MSG_INTERVAL * 1000);

    // Close the browser after a defined duration if needed
    setTimeout(async () => {
      clearInterval(intervalId); // Stop sending messages
      console.log("Stopping the bot...");
      await browser.close();
    }, BOT_DURATION * 60 * 1000);
  } catch (error) {
    console.error("Error in bot operation:", error);
  }
};

startBot();
