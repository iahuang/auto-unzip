# auto-unzip
A small, cross-platform program to automatically unzip downloaded files

## Setup

To install dependencies:
```
npm install
```

To run:
```
npm start
```

### (Windows)
To make this program open on startup, create a shortcut to the `startup.bat` file, and move it to the *Startup folder*, which can be accessed by pressing `Start`, searching for `Run` and pressing enter, then typing `shell:startup`. You may want to right click the shortcut > `Show properties` and have the file run in *minimized window mode*. 

Due to [known issues with `fs.watch`](https://github.com/microsoft/vscode-remote-release/issues/870), this program may not work properly on WSL2.