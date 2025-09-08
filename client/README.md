# KolekKita

## Initial Git Setup Command

### Create file
echo "# ExampleName" >> "File name"

### Initialize a new Git repository
git init

### Add all files
git add "File name"

### Commit files
git commit -m "Commit message"

### Rename branch to main
git branch -M main

### Add remote repository
git remote add origin https://github.com/MilSimm/KolekKita-Administrator-Website.git

### Push to GitHub
git push -u origin main



## Commit Command

### Add changes
git add .

### Commit changes
git commit -m "Commit message"

### Push changes to GitHub
git push
git push --force



## Check Command

### Check the current remote URL
git remote -v

### Highlights the current branch with an asterisk.
git branch

### Check your Git username and email used for commits.
git config user.name
git config user.email

### Check any uncommitted changes that might be lost after rebase
git status

### Check if there is are file that has not been comiited yet
git pull origin main --rebase
### Display the Hashes
git reflog
### To redo the command or bring it back
git reset --hard 012626a

## Forced Commit

### Force Commit: Overwrite the remote main branch with your local version
git push -u origin main --force



# Useful if you're on a different branch and want to switch back.
git checkout main
