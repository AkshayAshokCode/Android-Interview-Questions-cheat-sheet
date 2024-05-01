# Android-Interview-Questions-cheat-sheet
- ### What is Android?

Android is an open-sourced operating system that is used on mobile devices, such as mobiles and tablets. The Android application executes within its own process and its own instance of Dalvik Virtual Machine(DVM) or Android RunTime(ART).

- ### What is Android Runtime?

Android Runtime (ART) is the managed runtime used by applications and some system services on the Android operating system. It's responsible for executing and managing Android applications and providing a set of core libraries that applications can use. ART replaces the older Dalvik runtime, offering improved performance and memory efficiency through ahead-of-time (AOT) compilation and other optimizations. This shift from Dalvik to ART occurred in Android 5.0 (Lollipop) and has been further refined in subsequent Android releases.

- ### What is Dalvik Runtime?

The Dalvik runtime is the former managed runtime used by applications on the Android operating system prior to Android 5.0 (Lollipop). It's named after the village of Dalvik in Iceland. Dalvik was responsible for executing and managing Android applications, employing a just-in-time (JIT) compilation approach where bytecode is translated into native machine code at runtime. While Dalvik served its purpose well, it had some limitations in terms of performance and memory efficiency. Consequently, it was replaced by the Android Runtime (ART) starting from Android 5.0, which brought improvements such as ahead-of-time (AOT) compilation for enhanced performance and reduced memory usage.

- ### Just-in-Time (JIT) vs Android Runtime (AOT)?

Just-in-Time (JIT) compilation and Ahead-of-Time (AOT) compilation are two different approaches to compiling and executing code, each with its advantages and disadvantages.

#### Just-in-Time (JIT) Compilation:

- JIT compilation involves translating code from a high-level intermediate representation (such as bytecode) into native machine code at runtime, usually when the code is first executed.
- JIT compilation can optimize code for the specific hardware it's running on, leading to potentially better performance.
- It allows for more dynamic optimizations, such as inlining, loop unrolling, and dead code elimination, based on runtime information.
- However, JIT compilation can introduce overhead during program execution, as the compilation process itself takes time, and there may be a delay before the optimized code is available for execution.

#### Ahead-of-Time (AOT) Compilation:

- AOT compilation involves translating code from a high-level intermediate representation into native machine code before the program is executed, typically during the build process or installation.
- AOT-compiled code is ready to execute immediately without the overhead of JIT compilation at runtime.
- AOT compilation can result in faster startup times and reduced runtime overhead, especially for applications that don't benefit significantly from dynamic optimizations.
- However, AOT-compiled code may not be as optimized for the specific hardware it's running on, as optimizations are done without knowledge of the runtime environment.

In summary, JIT compilation offers dynamic optimizations tailored to the runtime environment but incurs overhead during execution, while AOT compilation provides faster startup times and reduced runtime overhead but may lack some runtime-specific optimizations. The choice between JIT and AOT compilation depends on factors such as the target platform, performance requirements, and the characteristics of the application being compiled.
