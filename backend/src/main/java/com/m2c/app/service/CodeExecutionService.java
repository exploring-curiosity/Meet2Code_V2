package com.m2c.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class CodeExecutionService {

    private static final long EXECUTION_TIMEOUT_SECONDS = 10;
    private static final String TEMP_DIR = System.getProperty("java.io.tmpdir") + "/m2c-executions/";

    public ExecutionResult executeCode(String code, String language, String input) {
        String executionId = UUID.randomUUID().toString();
        Path workDir = Path.of(TEMP_DIR, executionId);

        try {
            Files.createDirectories(workDir);

            ExecutionResult result = switch (language.toLowerCase()) {
                case "python" -> executePython(code, input, workDir);
                case "javascript", "js" -> executeJavaScript(code, input, workDir);
                case "java" -> executeJava(code, input, workDir);
                case "cpp", "c++" -> executeCpp(code, input, workDir);
                case "c" -> executeC(code, input, workDir);
                case "go" -> executeGo(code, input, workDir);
                default -> new ExecutionResult(false, "", "Unsupported language: " + language, 0);
            };

            return result;
        } catch (Exception e) {
            log.error("Execution error for language {}: {}", language, e.getMessage(), e);
            return new ExecutionResult(false, "", "Execution error: " + e.getMessage(), 0);
        } finally {
            // Cleanup
            cleanupDirectory(workDir.toFile());
        }
    }

    private ExecutionResult executePython(String code, String input, Path workDir) throws Exception {
        Path scriptPath = workDir.resolve("script.py");
        Files.writeString(scriptPath, code);

        return runProcess(
                List.of("python3", scriptPath.toString()),
                input,
                workDir
        );
    }

    private ExecutionResult executeJavaScript(String code, String input, Path workDir) throws Exception {
        Path scriptPath = workDir.resolve("script.js");
        Files.writeString(scriptPath, code);

        return runProcess(
                List.of("node", scriptPath.toString()),
                input,
                workDir
        );
    }

    private ExecutionResult executeJava(String code, String input, Path workDir) throws Exception {
        // Extract class name from code
        String className = extractJavaClassName(code);
        if (className == null) {
            className = "Main";
            code = "public class Main {\n" + code + "\n}";
        }

        Path javaFile = workDir.resolve(className + ".java");
        Files.writeString(javaFile, code);

        // Compile
        ProcessBuilder compileBuilder = new ProcessBuilder("javac", javaFile.toString());
        compileBuilder.directory(workDir.toFile());
        Process compileProcess = compileBuilder.start();
        
        if (!compileProcess.waitFor(EXECUTION_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            compileProcess.destroy();
            return new ExecutionResult(false, "", "Compilation timeout", 0);
        }

        if (compileProcess.exitValue() != 0) {
            String error = readStream(compileProcess.getErrorStream());
            return new ExecutionResult(false, "", "Compilation error: " + error, 0);
        }

        // Execute
        return runProcess(
                List.of("java", "-cp", workDir.toString(), className),
                input,
                workDir
        );
    }

    private ExecutionResult executeCpp(String code, String input, Path workDir) throws Exception {
        Path sourceFile = workDir.resolve("program.cpp");
        Path executable = workDir.resolve("program");
        Files.writeString(sourceFile, code);

        // Compile
        ProcessBuilder compileBuilder = new ProcessBuilder(
                "g++", "-std=c++17", "-O2", sourceFile.toString(), "-o", executable.toString()
        );
        compileBuilder.directory(workDir.toFile());
        Process compileProcess = compileBuilder.start();

        if (!compileProcess.waitFor(EXECUTION_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            compileProcess.destroy();
            return new ExecutionResult(false, "", "Compilation timeout", 0);
        }

        if (compileProcess.exitValue() != 0) {
            String error = readStream(compileProcess.getErrorStream());
            return new ExecutionResult(false, "", "Compilation error: " + error, 0);
        }

        // Execute
        return runProcess(
                List.of(executable.toString()),
                input,
                workDir
        );
    }

    private ExecutionResult executeC(String code, String input, Path workDir) throws Exception {
        Path sourceFile = workDir.resolve("program.c");
        Path executable = workDir.resolve("program");
        Files.writeString(sourceFile, code);

        // Compile
        ProcessBuilder compileBuilder = new ProcessBuilder(
                "gcc", "-std=c11", "-O2", sourceFile.toString(), "-o", executable.toString()
        );
        compileBuilder.directory(workDir.toFile());
        Process compileProcess = compileBuilder.start();

        if (!compileProcess.waitFor(EXECUTION_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            compileProcess.destroy();
            return new ExecutionResult(false, "", "Compilation timeout", 0);
        }

        if (compileProcess.exitValue() != 0) {
            String error = readStream(compileProcess.getErrorStream());
            return new ExecutionResult(false, "", "Compilation error: " + error, 0);
        }

        // Execute
        return runProcess(
                List.of(executable.toString()),
                input,
                workDir
        );
    }

    private ExecutionResult executeGo(String code, String input, Path workDir) throws Exception {
        Path sourceFile = workDir.resolve("main.go");
        Files.writeString(sourceFile, code);

        return runProcess(
                List.of("go", "run", sourceFile.toString()),
                input,
                workDir
        );
    }

    private ExecutionResult runProcess(List<String> command, String input, Path workDir) throws Exception {
        long startTime = System.currentTimeMillis();

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.directory(workDir.toFile());
        builder.redirectErrorStream(false);

        Process process = builder.start();

        // Provide input
        if (input != null && !input.isEmpty()) {
            try (var writer = process.outputWriter()) {
                writer.write(input);
                writer.flush();
            }
        }

        // Wait for completion with timeout
        boolean completed = process.waitFor(EXECUTION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        long executionTime = System.currentTimeMillis() - startTime;

        if (!completed) {
            process.destroy();
            return new ExecutionResult(false, "", "Execution timeout exceeded", executionTime);
        }

        String output = readStream(process.getInputStream());
        String error = readStream(process.getErrorStream());
        boolean success = process.exitValue() == 0;

        return new ExecutionResult(success, output, error, executionTime);
    }

    private String readStream(java.io.InputStream stream) throws Exception {
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                result.append(line).append("\n");
            }
        }
        return result.toString().trim();
    }

    private String extractJavaClassName(String code) {
        // Simple regex to extract public class name
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("public\\s+class\\s+(\\w+)");
        java.util.regex.Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private void cleanupDirectory(File dir) {
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isDirectory()) {
                        cleanupDirectory(file);
                    } else {
                        file.delete();
                    }
                }
            }
            dir.delete();
        }
    }

    public record ExecutionResult(
            boolean success,
            String output,
            String error,
            long executionTimeMs
    ) {}
}
