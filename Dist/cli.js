import { main } from "./index.js";
import inquirer from "inquirer";
import chalk from "chalk";
import spinner from "nanospinner";

function welcome() {
  console.log(`\n${chalk.cyan.bold("welcome to stack search")}\n`);
}
async function askForParams() {
  const question = await inquirer.prompt({
    name: "query",
    type: "input",
    message: "Enter your question",
    validate: function (answer) {
      if (answer == "") return "You need to enter non empty question";
      return true;
    },
  });
  const stealth = await inquirer.prompt({
    name: "proxy",
    type: "list",
    message: "Do you wanna use proxy rotation?",
    choices: ["Yes, use proxy rotation", "No, dont use proxy rotation"],
  });
  return {
    query: question.query,
    withProxy: stealth.proxy == "Yes, use proxy rotation",
  };
}

async function displayAnswers(answers, fetchSpinner) {
  let currentAnswer = 0;
  fetchSpinner.success({
    text: `Your answers are :
        ${chalk.cyan(answers[currentAnswer])}
        `,
  });
  while (currentAnswer < answers.length) {
    currentAnswer++;
    const moreAnswers = await inquirer.prompt({
      name: "bool",
      type: "list",
      message: "Do you want the next answer?",
      choices: ["Yes, show the next answer", "No,exit the program"],
    });
    if (moreAnswers.bool == "Yes, show the next answer") {
      console.log(`\n${chalk.cyan(answers[currentAnswer])}`);
    } else return;
  }
}

async function run() {
  welcome();
  const params = await askForParams();
  const fetchSpinner = spinner
    .createSpinner("waiting for the answers", {
      color: "green",
    })
    .start();
  const resualts = await main(params.query, params.withProxy);
  if (resualts.type == 1) {
    fetchSpinner.error({ text: resualts.data });
    process.exit(1);
  } else {
    displayAnswers(resualts.data, fetchSpinner);
  }
}
run();
