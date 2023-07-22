## StackOverflow seacrh cli tool

### Setup

1-First you need to have nodejs installed (make sure that you have version ^16)

2-Open your vscode terminal and write these commands

```
  git clone "https://github.com/Shinji13/stackSearch"
  cd stackSearch
  npm install
```

3-Add .env file that should look like this

```
 PROXY_USERNAME=val
 PROXY_PASSWORD=val
 PROXY_URL=val
 LOCAL_BROWSER_PATH="C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
```

You may need to change the path to your chrome browser and you dont need to add proxy parameters in case you dont wanna use proxy rotation

4-run this command (add sudo if use linux)

```
 npm install -g stackSearch
```

### How to use it

1-type stack search in your cli
2-enter the question
3-choose whether to use proxy rotation or not
4-get the answer and you will be prompted to whether it print the next answer (answers are ordered by voting)
