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

- ### What is Garbage collector?

  In Android, the Garbage Collector (GC) is a key component of the Java Virtual Machine (JVM) responsible for automatic memory management. Its primary role is to reclaim memory occupied by objects that are no longer in use, thus preventing memory leaks and ensuring efficient memory usage within the application.
    
    Here's how the Garbage Collector works in Android:
    
    1. **Memory Allocation**: When an Android application creates objects, memory is allocated to store these objects. The Garbage Collector keeps track of allocated memory.
    2. **Mark and Sweep**: Periodically, or when triggered by certain conditions, the Garbage Collector performs a process known as "mark and sweep." During the mark phase, it traverses through all reachable objects starting from a set of root objects (such as those referenced by active threads, static variables, etc.) and marks them as reachable. Any objects not marked as reachable are considered unreachable and are candidates for garbage collection. In the sweep phase, it reclaims memory occupied by unreachable objects, making it available for future allocations.
    3. **Memory Reclamation**: The Garbage Collector releases the memory occupied by unreachable objects, making it available for new object allocations. This process prevents memory leaks and ensures that the application doesn't run out of memory over time.
    
    Android offers several types of garbage collectors, such as the Concurrent Mark-Sweep (CMS) collector, the Garbage First (G1) collector, and the default collector based on the generational Garbage Collector from the Java Virtual Machine (JVM). Each collector has its characteristics and trade-offs in terms of performance and memory overhead, allowing developers to choose the most suitable one based on their application's requirements and device constraints.
    

- ### What is DEX?

  DEX stands for Dalvik Executable, and it's a file format used in Android for packaging and executing compiled bytecode. When you write an Android application in Java or Kotlin, the source code is compiled into bytecode, which is a set of instructions understood by the Java Virtual Machine (JVM). However, Android doesn't use the JVM; instead, it uses its own runtime environment called the Dalvik Virtual Machine (DVM) or, more recently, the Android Runtime (ART).
    
    The DEX format is optimized for Android's runtime environment and is generated from the bytecode produced by compiling your Java or Kotlin code. The main purpose of the DEX format is to efficiently package and execute bytecode on Android devices while minimizing memory usage and improving performance.
    
    DEX files contain executable code, resources, and metadata required by the Android system to run your application. They are typically generated during the build process of an Android application, and the final APK (Android Package) file contains one or more DEX files along with other resources.
    
    Overall, DEX files play a crucial role in the Android application development process, serving as the executable format for Android applications and enabling them to run efficiently on a wide range of devices.
    

- ### What is multidex?

  Multidex, short for "multidexing," is a feature in Android that allows applications to surpass the method reference limit imposed by the Dalvik Executable (DEX) format. In Android, each DEX file has a method reference limit, which is the maximum number of methods that can be referenced within a single DEX file. This limitation can become a problem for large applications that exceed this limit due to the large number of methods generated from their code, dependencies, and libraries.
    
    Multidexing addresses this limitation by enabling an application to have multiple DEX files, hence the term "multidex." When multidexing is enabled, the build process generates multiple DEX files for the application, each containing a subset of the methods. This allows the application to reference more methods than would be possible with a single DEX file.
    
    Multidexing is particularly useful for large applications, such as those that use many libraries or have a substantial amount of code, including projects with extensive use of third-party dependencies. By enabling multidexing, developers can avoid hitting the method reference limit and ensure that their applications can run smoothly on Android devices.
    
    Multidexing can be enabled in an Android application by configuring the build process, typically through build.gradle configuration settings. While multidexing allows developers to overcome the method reference limit, it's important to note that it can slightly impact application startup time due to the additional overhead of loading multiple DEX files. However, for most applications, the performance impact is minimal and outweighed by the benefits of avoiding method reference limit issues.

- ### How does memory is managed in the OS?

  Memory management in an operating system (OS) involves several key tasks to efficiently allocate, utilize, and deallocate memory resources. Here's an overview of how memory is managed in an OS:
  
  1. **Memory Allocation**: When a process is created or requests memory, the OS allocates memory space to the process. This allocation can happen through various mechanisms such as fixed partitioning, dynamic partitioning, or paging.
  2. **Address Translation**: Modern operating systems use virtual memory to abstract physical memory addresses from processes. Each process sees its memory space as a contiguous block of addresses, known as virtual addresses. The OS is responsible for translating these virtual addresses into physical addresses, allowing processes to access physical memory transparently.
  3. **Memory Protection**: The OS enforces memory protection to prevent processes from accessing memory locations that they shouldn't. This involves setting up memory access permissions (read, write, execute) for each memory page and trapping any attempts to access unauthorized memory.
  4. **Memory Paging and Swapping**: Paging and swapping are techniques used by the OS to manage memory efficiently. Paging involves dividing physical memory into fixed-size blocks called pages. The OS maintains a page table to map virtual pages to physical pages. Swapping involves moving entire pages of memory between RAM and disk storage to free up physical memory when it's needed.
  5. **Memory Reclamation**: When a process terminates or no longer requires certain memory resources, the OS deallocates the memory and returns it to the pool of available memory. This prevents memory leaks and ensures that memory is efficiently utilized.
  6. **Memory Fragmentation**: The OS also manages memory fragmentation, which can occur when memory becomes fragmented into small, non-contiguous chunks over time. Fragmentation can impact memory allocation efficiency and overall system performance. Techniques such as memory compaction or defragmentation may be used to reduce fragmentation and optimize memory usage.
  7. **Memory Monitoring and Optimization**: Operating systems often include tools and mechanisms for monitoring memory usage and performance. This may include memory usage statistics, memory leak detection, and memory profiling tools to help developers identify and address memory-related issues in applications.
  
  Overall, effective memory management is essential for maintaining system stability, performance, and resource utilization in an operating system. The OS employs various techniques and algorithms to manage memory efficiently and provide a reliable execution environment for applications running on the system.

- ### Write code having memory leaks?
  One common scenario for memory leaks is when objects are unintentionally kept in memory longer than necessary, preventing the garbage collector from reclaiming them. Here's a simple Java example that demonstrates a memory leak:
  ```java
  import java.util.ArrayList;
  import java.util.List;
  
  public class MemoryLeakExample {
      private static final List<Object> list = new ArrayList<>();
  
      public static void main(String[] args) {
          while (true) {
              Object obj = new Object();
              list.add(obj);
              // Uncomment the following line to simulate a memory leak by not removing objects from the list
              // list.remove(obj);
          }
      }
  }
  ```
  In this example, a program creates an ArrayList list and continuously adds new Object instances to it within an infinite loop. However, it never removes objects from the list. As a result, the list keeps growing indefinitely, consuming more and more memory over time. This behavior constitutes a memory leak because objects are retained in memory unnecessarily, preventing the garbage collector from reclaiming memory used by those objects.
  
  To avoid memory leaks, it's essential to ensure that objects are removed from data structures like lists when they are no longer needed. In this example, uncommenting the line list.remove(obj); inside the loop would prevent the memory leak by removing objects from the list after they are added.

- ### what is LRU Cache?
  LRU Cache stands for Least Recently Used Cache, and it's a type of caching mechanism used in computer science to store a fixed number of items (such as objects, data, or values) in memory. The key feature of an LRU Cache is that when the cache reaches its capacity limit and a new item needs to be added, the least recently used item in the cache is evicted to make room for the new item.
  
  Here's how an LRU Cache typically works:
  
  Cache Initialization: An LRU Cache is initialized with a fixed capacity, which determines the maximum number of items it can hold.
  Cache Operations: The cache supports two main operations: "get" and "put."
  Get Operation: When an item is requested from the cache (via a "get" operation), the cache checks if the item is already present in the cache. If the item is found, it is returned, and its access time is updated to indicate that it was recently accessed.
  Put Operation: When a new item needs to be added to the cache (via a "put" operation), the cache checks if the cache is full. If the cache is not full, the new item is added to the cache. If the cache is full, the least recently used item in the cache is evicted (removed), and the new item is added.
  LRU Policy: The key aspect of an LRU Cache is its eviction policy, which is based on the principle of least recently used. Whenever an item is accessed (via a "get" operation), its access time is updated to indicate that it was recently used. When the cache is full and a new item needs to be added (via a "put" operation), the item that was accessed the least recently is evicted from the cache to make room for the new item.
  LRU Caches are commonly used in various applications and systems where efficient caching of frequently accessed data is required. They offer a balance between memory usage and performance by ensuring that frequently accessed items remain in the cache while evicting less frequently used items when the cache reaches its capacity limit.
