// Language configurations for Monaco and display
export const LANGUAGES = [
  { value: "javascript", label: "JavaScript", icon: "🟨", monacoLang: "javascript" },
  { value: "typescript", label: "TypeScript", icon: "🔷", monacoLang: "typescript" },
  { value: "python",     label: "Python",     icon: "🐍", monacoLang: "python"     },
  { value: "cpp",        label: "C++",        icon: "⚙️", monacoLang: "cpp"        },
  { value: "java",       label: "Java",       icon: "☕", monacoLang: "java"       },
]

// Default starter code per language
export const DEFAULT_CODE = {
  javascript: `// JavaScript
function solution() {
  console.log("Hello World!")
}

solution()`,

  typescript: `// TypeScript
function solution(): void {
  console.log("Hello World!")
}

solution()`,

  python: `# Python
def solution():
    print("Hello World!")

solution()`,

  cpp: `// C++
#include <iostream>
using namespace std;

int main() {
    cout << "Hello World!" << endl;
    return 0;
}`,

  java: `// Java
public class solution {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
}`,
}

export const LANGUAGE_CONFIGS = {
  javascript: {
    image: "node:18-alpine",
    filename: "solution.js",
    runCmd: ["node", "solution.js"],
  },
  typescript: {
    image: "node:18-alpine",
    filename: "solution.ts",
    runCmd: ["npx", "--yes", "ts-node", "solution.ts"],
  },
  python: {
    image: "python:3.11-alpine",
    filename: "solution.py",
    runCmd: ["python", "solution.py"],
  },
  cpp: {
    image: "gcc:latest",
    filename: "solution.cpp",
    runCmd: ["sh", "-c", "g++ solution.cpp -o solution && ./solution"],
  },
  java: {
    image: "eclipse-temurin:17-alpine",
    filename: "solution.java",
    runCmd: ["sh", "-c", "javac solution.java && java solution"],
  },
}