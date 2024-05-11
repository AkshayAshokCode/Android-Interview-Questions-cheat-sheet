# Android-Interview-Questions-cheat-sheet (WIP)
Note: I'm currently preparing this repo, and I'll restructure it once I have done with basic preperation

## Android
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

- ### Why does an Android App lag?

  Android apps can lag due to various factors, including:
  
  1. **Inefficient Code**: Poorly optimized code, such as inefficient algorithms, excessive memory usage, or frequent garbage collection, can lead to performance issues and lag in the app.
  2. **UI Thread Blocking**: Performing long-running operations on the main UI thread, such as network requests or heavy computation, can block the UI thread and result in unresponsive or slow user interface interactions.
  3. **Memory Leaks**: Memory leaks occur when objects are unintentionally retained in memory, consuming resources over time and potentially causing performance degradation and lag.
  4. **Excessive Resource Usage**: Apps that consume excessive CPU, memory, or battery resources can impact overall device performance and cause lag, especially on older or less powerful devices.
  5. **Background Processes**: Background processes, such as services or broadcast receivers, that run unnecessarily or for extended periods can drain system resources and contribute to lag in the app and the device.
  6. **Network Issues**: Slow or unreliable network connections can cause delays in data retrieval, resulting in lag when loading content or interacting with remote servers.
  7. **Device Constraints**: The performance of an app can be affected by the hardware capabilities of the device, such as CPU speed, memory size, and graphics processing power. Apps may experience lag on older or less powerful devices with limited resources.
  8. **Third-Party Libraries**: Integrating third-party libraries into an app without considering their performance impact can introduce overhead and potential lag, especially if the libraries are inefficiently implemented or not properly managed.
  
  To address lag issues in Android apps, developers can use various strategies such as optimizing code, offloading intensive tasks to background threads or services, implementing efficient caching mechanisms, profiling and analyzing app performance, and prioritizing responsiveness and resource efficiency in app design. Additionally, regularly testing the app on different devices and under various network conditions can help identify and address performance bottlenecks and improve the overall user experience.

- ### What is Context? How is it used?

  In Android, **`Context`** is an abstract class that provides information about the application environment and allows access to application-specific resources and functionalities. It serves as a handle to the Android system, enabling an application to interact with various system components and services.
  
  **`Context`** is a fundamental concept in Android development and is used in various scenarios, including:
  
  1. **Accessing Resources**: **`Context`** allows access to application-specific resources such as strings, colors, drawables, layouts, and raw files. It provides methods like **`getString()`**, **`getColor()`**, **`getDrawable()`**, etc., to retrieve these resources.
  2. **Accessing System Services**: **`Context`** allows access to system services such as the **`LayoutInflater`**, **`PackageManager`**, **`NotificationManager`**, **`LocationManager`**, and others. System services are accessed via the **`getSystemService()`** method, passing the appropriate service name as a parameter.
  3. **Launching Activities**: **`Context`** is used to start new activities within an application using methods like **`startActivity()`** or **`startActivityForResult()`**.
  4. **Broadcasting Intents**: **`Context`** is used to send and receive broadcast intents using methods like **`sendBroadcast()`** or **`registerReceiver()`**.
  5. **Accessing Application-specific Information**: **`Context`** provides methods to access application-specific information such as the application's package name (**`getPackageName()`**), application context (**`getApplicationContext()`**), application data directory (**`getFilesDir()`**), and more.
  
  **`Context`** is typically obtained within an Android application through various sources:
  
  - **Activity Context**: Each **`Activity`** in Android has its own **`Context`**, accessible via the **`this`** keyword or **`getContext()`** method.
  - **Application Context**: The **`Application`** class provides a global application context, which can be obtained using the **`getApplicationContext()`** method.
  - **Service Context**: Services such as **`IntentService`**, **`Service`**, or **`JobIntentService`** have their own context accessible via the **`this`** keyword or **`getApplicationContext()`** method.
  - **Receiver Context**: Broadcast receivers can obtain a context via the **`onReceive()`** method parameter.
  
  It's important to use the appropriate **`Context`** instance based on the context in which it's needed to avoid memory leaks and other issues. For example, using the application context is recommended for long-lived objects or when a **`Context`** is needed outside the scope of an activity or service.

- ### Tell all the Android application components?

  In Android, there are four main application components that serve as building blocks for constructing an Android application:
  
  1. **Activities**:
      - Activities represent the UI (User Interface) and the entry point for interaction with the user. They typically correspond to a single screen with a user interface, but they can also be used in various ways to achieve different functionalities, such as displaying a dialogue or launching another activity.
      - Each activity is implemented as a subclass of the **`Activity`** class and has its own lifecycle methods like **`onCreate()`**, **`onStart()`**, **`onResume()`**, **`onPause()`**, **`onStop()`**, and **`onDestroy()`**.
  2. **Services**:
      - Services are background processes that run without a user interface and perform long-running operations or handle background tasks. They can continue running even when the user switches to another application or leaves the application entirely.
      - Services can be started using **`startService()`** and stopped using **`stopService()`**, or they can be bound to components using **`bindService()`** and unbound using **`unbindService()`**.
      - Examples of services include downloading files in the background, playing music, or processing data.
  3. **Broadcast Receivers**:
      - Broadcast receivers respond to system-wide broadcast announcements, such as the device booting up, the battery being low, or a new SMS message received.
      - They don't have a user interface and are typically used to perform tasks in response to broadcast intents.
      - Broadcast receivers are implemented as subclasses of the **`BroadcastReceiver`** class and registered either statically in the manifest file or dynamically in code.
      - Examples include reacting to the device being connected to a power source or responding to a custom broadcast sent by an application.
  4. **Content Providers**:
      - Content providers manage access to a structured set of data, typically stored in a SQLite database, and provide a standardized interface for accessing and sharing data between applications.
      - They encapsulate data and provide methods for querying, inserting, updating, and deleting data, enforcing data access permissions and security.
      - Content providers are typically accessed through a content URI and a set of ContentResolver methods like **`query()`**, **`insert()`**, **`update()`**, and **`delete()`**.
      - Examples include the Contacts Provider for accessing contact information or the MediaStore Provider for accessing media files.
  
  These four components work together to create the user interface, handle background tasks, respond to system events, and manage data in an Android application. By combining these components creatively, developers can build a wide range of applications with diverse functionalities and user experiences.

- ### What is AndroidManifest.xml?

  The **`AndroidManifest.xml`** file is a crucial configuration file in Android development that provides essential information about your Android application to the Android system. It serves as a blueprint for the Android system to understand various aspects of your application, including its components, permissions, hardware requirements, and metadata.
  
  Here are some key aspects of the **`AndroidManifest.xml`** file:
  
  1. **Application Components**: The manifest file declares all the components of your application, including activities, services, broadcast receivers, and content providers. Each component is defined with its name, type, and configuration settings.
  2. **Permissions**: The manifest file specifies the permissions that your application requires to access system features or sensitive data. These permissions must be declared explicitly, and the user must grant them when installing the application.
  3. **Intent Filters**: Intent filters specify the types of intents that each component can respond to. For example, activities can specify intent filters to handle actions like opening a specific type of file or viewing a particular type of content.
  4. **Metadata**: The manifest file can include metadata elements to provide additional information about the application, such as version numbers, descriptions, or configuration settings.
  5. **Application Attributes**: The **`<application>`** element in the manifest file can have attributes that configure various aspects of the application, such as its theme, icon, label, or whether it supports multi-window mode.
  6. **Permissions and Security**: The manifest file defines the security model for your application, specifying which permissions are required and which components are exposed to other applications.
  
  The **`AndroidManifest.xml`** file is located in the **`manifests/`** directory of your Android project and is typically the first file that the Android system reads when installing and launching your application. It's essential to maintain an accurate and up-to-date manifest file to ensure proper functionality and compatibility of your application with the Android platform.

- ### List of android activity attributes.

  Activities have various attributes that can be defined in the AndroidManifest.xml file or programmatically. Some common attributes include:
  
  1. **Name**: Specifies the Java class that implements the activity.
  2. **Label**: Sets the user-visible label for the activity.
  3. **Icon**: Specifies the icon for the activity.
  4. **Theme**: Defines the visual style for the activity.
  5. **Intent filters**: Specifies the types of intents that the activity can respond to.
  6. **Launch mode**: Defines how the activity should be launched.
      - **`standard`**: Default mode. Creates a new instance of the activity every time it's launched.
      - **`singleTop`**: If the activity is at the top of the stack, it will not be recreated. Otherwise, a new instance will be created.
      - **`singleTask`**: A single instance of the activity will be created, and it will become the root of a new task.
      - **`singleInstance`**: A single instance of the activity will be created in a new task, isolated from the activity stack.
  7. **Task Affinity**: Determines which task the activity belongs to.
  8. **Allow Task Reparenting**: Specifies whether the activity can move from one task to another.
  9. **Clear Task on Launch**: Specifies whether to remove all activities from the task when the activity is re-launched.
  10. **Always Retain Task State**: Determines whether the task's state is always retained.
  11. **Finish on Task Launch**: Specifies whether the activity should be finished when the user navigates away from the task.
  12. **State Not Needed**: Specifies whether the system should never save the state of the activity.
  13. **Multiprocess**: Specifies whether the activity can run in multiple processes.
  14. **Permission**: Defines a required permission for starting the activity.
  15. **Enabled**: Specifies whether the activity can be instantiated by the system.
  16. **Exported**: Specifies whether the activity is accessible to other applications.
  17. **Allow Task Reparenting**: Specifies whether the activity can move from one task to another.
  18. **Always Focusable**: Specifies whether the activity's main window should be visible to the user.
  19. **Auto Remove From Recents**: Specifies whether the activity should be removed from the recent tasks list.
  20. **Color Mode**: Specifies the color mode for the activity.
  21. **Document Launch Mode**: Specifies the launch mode for activities opened from a document or task.
      - **`intoExisting`**: Launches the activity into an existing document or task if possible.
      - **`always`**: Always creates a new document or task when launching the activity.
      - **`none`**: Does not launch the activity into a document or task.
  22. **Exclude From Recents**: Specifies whether the activity should be excluded from the recent tasks list.
  23. **Hardware Accelerated**: Specifies whether hardware acceleration is enabled for the activity's window.
  24. **Immersive Mode**: Specifies whether the activity uses immersive mode.
  25. **Inherit Show When Locked**: Specifies whether the activity inherits the show when locked flag from its parent.
  26. **Inherit Transparent Context**: Specifies whether the activity inherits its parent's transparent context.
  27. **Inherit Transition Group**: Specifies whether the activity inherits its parent's transition group.
  28. **Inherit Task Affinity**: Specifies whether the activity inherits its parent's task affinity.
  29. **Inherit User Lock Screen**: Specifies whether the activity inherits its parent's user lock screen setting.
  30. **Inherit Voice Interaction Mode**: Specifies whether the activity inherits its parent's voice interaction mode.
  31. **Inherit Allow Task Reparenting**: Specifies whether the activity inherits its parent's allow task reparenting setting.
  32. **Inherit Visible**: Specifies whether the activity inherits its parent's visible setting.
  33. **No History**: Specifies whether the activity should be removed from the activity stack and finished when the user navigates away from it.
  34. **Parent Activity**: Indicates the parent activity of the current one.
  35. **Process**: Specifies the process in which the activity should run.
  36. **Recreate On Config Changes**: Specifies whether the activity should be recreated when the configuration changes.
  37. **Screen Orientation**: Specifies the allowed orientation(s) of the activity.
      - **`unspecified`**: System default orientation behavior.
      - **`landscape`**: Landscape orientation.
      - **`portrait`**: Portrait orientation.
      - **`behind`**: Retains the orientation of the previous activity.
  38. **Show When Locked**: Specifies whether the activity's window should be shown when the device is locked.
  39. **Split Name**: Specifies the name of the split APK associated with the activity.
  40. **Supports Picture-in-Picture**: Specifies whether the activity supports picture-in-picture mode.
  41. **Task Affinity**: Specifies the task affinity for the activity.
  42. **UI Options**: Specifies the UI options for the activity.
      - **`splitActionBarWhenNarrow`**: Splits the action bar when the screen is narrow.
      - **`actionBar`**: Shows the action bar.
      - **`actionBarOverlay`**: Overlays the action bar on top of the activity's content.
      - **`actionModeOverlay`**: Overlays the action mode bar on top of the activity's content.
      - **`none`**: No specific UI options are set.
  
  These attributes provide a wide range of customization options for defining the behavior and appearance of Android activities.

- ### Explain type of launch mode in activity with example?

  In Android, the launch mode of an activity determines how the activity should behave when it's launched or when it's already in the activity stack. There are four main launch modes available for activities, each serving different purposes and providing different behavior. Here are the four launch modes along with explanations and examples:
  
  1. **Standard**:
      - In the standard launch mode, each time you start the activity, a new instance of the activity is created and added to the activity stack.
      - This is the default launch mode if you don't specify any other launch mode.
      - Example: Suppose you have an app with multiple activities. Each time you navigate to Activity B from Activity A, a new instance of Activity B is created and added to the stack. If you press the back button from Activity B, it returns to the previous instance of Activity A.
  2. **SingleTop**:
      - In the singleTop launch mode, if an instance of the activity already exists at the top of the stack, a new instance is not created. Instead, the existing instance is reused (i.e., its **`onNewIntent()`** method is called).
      - If the activity is not at the top of the stack, a new instance is created and added to the stack.
      - Example: Suppose your app has an activity for displaying notifications. When the user taps on a notification, if the activity is already open (at the top of the stack), its existing instance is used to display the notification details. Otherwise, a new instance is created and added to the stack.
  3. **SingleTask**:
      - In the singleTask launch mode, a separate task (back stack) is created for the activity, and only one instance of the activity can exist in that task.
      - If the activity is already running in another task, the system brings the existing instance to the foreground, instead of creating a new instance.
      - Example: Suppose your app has a "Home" activity. When the user navigates to the "Home" activity from another app (e.g., via a launcher icon), a new instance of the "Home" activity is created in its own task. If the "Home" activity is already open in another task, the existing instance is brought to the foreground.
  4. **SingleInstance**:
      - In the singleInstance launch mode, the activity is launched in a new task, isolated from the rest of the activities in the application.
      - Only one instance of the activity can exist in the system, and it's shared by all applications.
      - Example: Suppose your app has a "Map" activity that handles map-related tasks. When the user navigates to the "Map" activity, it's launched in its own task. If the "Map" activity is already running, the existing instance is brought to the foreground instead of creating a new instance. This ensures that only one instance of the "Map" activity exists system-wide.
  
  These launch modes provide developers with flexibility in managing the behavior of activities and controlling their interaction with the activity stack and other tasks in the system.

- ### What is the `Application` class?

   The Application class in Android is the base class within an Android app that contains all other components such as activities and services. The Application class, or any subclass of the Application class, is instantiated before any other class when the process for your application/package is created.

- ### What is onSaveInstanceState() and onRestoreInstanceState() in activity?
  
  - onSaveInstanceState() - This method is used to store data before pausing the activity.
  - onRestoreInstanceState() - This method is used to recover the saved state of an activity when the activity is recreated after destruction. So, the onRestoreInstanceState() receives the bundle that contains the instance state information.

- ### We can recover saved data using **onRestoreInstanceState() or onCreate() then what is the difference in them?

  Yes, both approaches achieve the same goal of restoring the activity's state after a configuration change. However, it's important to note that **`onRestoreInstanceState()`** is called after **`onStart()`** whereas **`onCreate()`** is called before **`onStart()`**. Depending on your specific requirements and the timing of state restoration, you can choose the appropriate method to restore the activity's state. Both approaches are valid and commonly used in Android development.

- ### What is `Activity` and its lifecycle?

  [Learn from here](https://developer.android.com/guide/components/activities/activity-lifecycle)

- ### What is `Fragment` and its lifecycle?

  [Learn from here](https://developer.android.com/guide/fragments/lifecycle)

- ### When should you use a Fragment rather than an Activity?
  
  - When you have some UI components to be used across various activities
  - When multiple views can be displayed side by side just like ViewPager

- ### What is the difference between FragmentPagerAdapter vs FragmentStatePagerAdapter?

  - FragmentPagerAdapter: Each fragment visited by the user will be stored in the memory but the view will be destroyed. When the page is revisited, then the view will be created not the instance of the fragment.
  - FragmentStatePagerAdapter: Here, the fragment instance will be destroyed when it is not visible to the user, except the saved state of the fragment.

- ### What is the difference between adding/replacing fragment in backstack?

  `replace` removes the existing fragment and adds a new fragment, but `add` retains the existing fragments and adds a new fragment that means existing fragment will be active and they wont be in 'paused' state hence when a back button is pressed `onCreateView()` is not called for the existing fragment(the fragment which was there before new fragment was added).

- ### What is retained `Fragment`?

  By default, Fragments are destroyed and recreated along with their parent Activities when a configuration change occurs. Calling setRetainInstance(true) allows us to bypass this destroy-and-recreate cycle, signaling the system to retain the current instance of the fragment when the activity is recreated. It is deprecated now & with this onAttach() & onDetach() is also serves no purpose anymore.

- ### What is the purpose of `addToBackStack()` while commiting fragment transaction?

  By calling addToBackStack(), the replace transaction is saved to the back stack so the user can reverse the transaction and bring back the previous fragment by pressing the Back button.

- ### What are ViewGroups and how they are different from the Views?

  - View: View objects are the basic building blocks of User Interface(UI) elements in Android. View is a simple rectangle box which responds to the user’s actions. Examples are EditText, Button, CheckBox etc. View refers to the android.view.View class, which is the base class of all UI classes.
  - ViewGroup: ViewGroup is the invisible container. It holds View and ViewGroup. For example, LinearLayout is the ViewGroup that contains Button(View), and other Layouts also. ViewGroup is the base class for Layouts.

## Kotlin
- ### What is Kotlin?
  Kotlin is a modern programming language developed by JetBrains. It is statically typed and runs on the Java Virtual Machine (JVM). The Kotlin language is designed to be interoperable with Java, so you can use Kotlin code alongside Java code seamlessly. Aside from Android app development, it is also used for server-side and web development.

- ### How is Kotlin different from Java?
  Kotlin and Java both programming languages that run on the Java Virtual Machine (JVM). but Kotlin is designed to be more concise and expressive, reducing unnecessary code. One notable feature is its built-in null safety, helping to avoid common programming errors related to null values. Kotlin also introduces modern language features like extension functions and coroutines, offering developers more flexibility and improved productivity compared to Java.

- ### Explain the advantages of using Kotlin.
  Some advantages of using Kotlin include:
  - Concise Syntax: Kotlin’s syntax is more concise, reducing boilerplate code and making it easier to read and write.
  - Null Safety: Kotlin’s null safety features help prevent null pointer exceptions, enhancing code reliability.
  - Interoperability: Kotlin is fully interoperable with Java, allowing you to leverage existing Java libraries and frameworks in Kotlin projects.
  - Coroutines: Kotlin’s built-in support for coroutines simplifies asynchronous programming and improves performance.
  - Functional Programming: Kotlin supports functional programming constructs like higher-order functions and lambda expressions, making code more expressive and concise.
  - Tooling and Community Support: Kotlin has excellent tooling support, including IDE plugins for popular development environments. It also has a growing and active community, with abundant learning resources and libraries available.

- ### What are the basic data types in Kotlin?
  The basic data types in Kotlin are:
  - Numbers: This includes types like Int (for integers), Double (for double-precision floating-point numbers), Float (for single-precision floating-point numbers), Long (for long integers), Short (for short integers), and Byte (for bytes).
  - Booleans: The Boolean type represents logical values, either true or false.
  - Characters: The Char type represents a single character.
  - Strings: The String type represents a sequence of characters.

- ### What is the difference between val and var in Kotlin?
  In Kotlin, `val` and `var` are used to declare variables, but they have different characteristics:
  - `val` is used to declare read-only (immutable) variables. Once assigned, the value of a `val` cannot be changed.
  - `var` is used to declare mutable variables. The value of a `var` can be reassigned multiple times.

- ### Explain type inference in Kotlin.
  Type inference in Kotlin allows the compiler to automatically determine the type of a variable based on its initialization value. Each time you use a variable, you don’t have to specify its type explicitly.

- ### What are nullable types in Kotlin?
  In Kotlin, nullable types allow variables to hold null values in addition to their regular data type values. This is in contrast to non-nullable types, which cannot hold null values by default. By using nullable types, the compiler enforces null safety and reduces the occurrence of null pointer exceptions.

- ### How do you handle nullability in Kotlin?
  In Kotlin, you can handle nullability using several techniques:
  - Safe Calls: Use the safe call operator (?.) to safely access properties or call methods on a nullable object. If the object is null, the expression evaluates to null instead of throwing a null pointer exception.
  - Elvis Operator: The Elvis operator (?:) allows you to provide a default value when accessing a nullable object. If the object is null, the expression after the Elvis operator is returned instead.
  - Safe Casts: Use the safe cast operator (as?) to perform type casts on nullable objects. If the cast is unsuccessful, the result is null.
  - Non-Null Assertion: When you are certain that a nullable variable is not null at a specific point, you can use the non-null assertion operator (!!) to bypass null safety checks. However, if the variable is actually null, a null pointer exception will occur.

- ### What is the Elvis operator in Kotlin?
  The Elvis operator (?:) is a shorthand notation in Kotlin that provides a default value when accessing a nullable object. It is useful in scenarios where you want to assign a default value if a nullable object is null.

- ### Explain the concept of smart casts in Kotlin.
  Smart casts in Kotlin allow the compiler to automatically cast a variable to a non-nullable type after a null check. As a result, type casting is no longer necessary, and code readability and safety are enhanced.
When a variable is checked for null using an if or when statement, the compiler can automatically cast the variable to a non-nullable type within the corresponding block.

- ### What are Kotlin collections?
  Kotlin collections are used to store and manage groups of related data items. They provide a convenient way to work with multiple values as a single unit. Kotlin offers various collection types, such as lists, sets, and maps, each with its own characteristics and functionalities.

- ### What is the difference between a list and an array in Kotlin?
  In Kotlin, a list is an ordered collection that can store elements of any type, while an array is a fixed-size collection that stores elements of a specific type. Here are the main differences:
  - Size: Lists can dynamically grow or shrink in size, whereas arrays have a fixed size that is determined at the time of creation.
  - Type Flexibility: Lists can store elements of different types using generics, allowing for heterogeneity. Arrays, on the other hand, are homogeneous and can store elements of a single type.
  - Modification: Lists provide convenient methods for adding, removing, or modifying elements. Arrays have fixed sizes, so adding or removing elements requires creating a new array or overwriting existing elements.
  - Performance: Arrays generally offer better performance for direct element access and modification, as they use contiguous memory locations. Lists, being dynamic, involve some level of overhead for resizing and maintaining their internal structure.

- ### How do you create an empty list in Kotlin?
  In Kotlin, you can create an empty list using the listOf() function with no arguments. This creates a list with zero elements.

- ### What is the difference between an immutable and a mutable list in Kotlin?
  In Kotlin, an immutable list (read-only list) is created using the listOf() function, and its elements cannot be modified once the list is created. On the other hand, a mutable list can be modified by adding, removing, or modifying its elements using specific functions.

- ### Explain the concepts of immutable and mutable variables in Kotlin.
  In Kotlin, variables can be either immutable or mutable.
  - Immutable Variables: Immutable variables are declared using the val keyword. Once assigned a value, its value cannot be changed or reassigned. They are read-only and provide a guarantee of immutability.
  - Mutable Variables: Mutable variables are declared using the var keyword. They can be assigned a value initially and then modified or reassigned later. Mutable variables provide flexibility for value changes during program execution.

- ### What is a lambda expression in Kotlin?
  A lambda expression in Kotlin is a way to define a function-like construct without explicitly declaring a function. It allows you to create a block of code that can be passed around as an argument or stored in a variable.

- ### Explain the concept of higher-order functions in Kotlin.
  In Kotlin, higher-order functions are functions that can accept other functions as parameters or return functions as results. They treat functions as first-class citizens, allowing for functional programming paradigms.

- ### What is the use of the lateinit modifier in Kotlin?
  The lateinit modifier in Kotlin is used to declare properties that will be assigned a value later, but not at the time of declaration. It is specifically used with mutable properties of non-null types.

- ### What is a data class in Kotlin?
  In Kotlin, a data class is a special type of class that is primarily used to hold data/state rather than behavior. It is designed to automatically generate common methods such as equals(), hashCode(), toString(), and copy() based on the properties defined in the class.

- ### Explain the concept of extension functions in Kotlin.
  Extension functions in Kotlin allow you to add new functions to existing classes without modifying their source code. They provide a way to extend the functionality of a class without the need for inheritance or modifying the original class.
