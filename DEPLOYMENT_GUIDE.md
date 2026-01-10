
# Deploying Your Game to GitHub Pages

Follow these steps to deploy your game to GitHub Pages:

## 1. Build the Game

First, you need to create a production-ready build of your game. This will create a `dist` folder with all the optimized files needed to run your game.

Open a terminal and run the following command:

```bash
npm install && npm run build
```

## 2. Deploy to GitHub Pages

Next, you'll need to install the `gh-pages` package, which makes it easy to deploy to GitHub Pages.

```bash
npm install -g gh-pages
```

Then, run the following command to deploy the contents of the `dist` folder to the `gh-pages` branch of your repository:

```bash
gh-pages -d dist
```

## 3. Configure GitHub Pages

Finally, you need to configure your GitHub repository to serve the `gh-pages` branch as a website.

1.  Go to your repository on GitHub.
2.  Click on the "Settings" tab.
3.  In the left sidebar, click on "Pages."
4.  Under "Source," select the `gh-pages` branch from the dropdown menu.
5.  Click "Save."

After a few minutes, your game will be live at the URL you specified in the `homepage` field of your `package.json` file:

[https://Lexicon1971.github.io/Starbuck-new-instance-created-10-01-2026](https://Lexicon1971.github.io/Starbuck-new-instance-created-10-01-2026)
