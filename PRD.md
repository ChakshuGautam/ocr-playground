UI/UX Design Specification for an Evaluation-Driven AI Handwriting Assessment Platform
Section 1: The Foundation - Workspace and Asset Management
This section establishes the foundational user interfaces for managing the core assets of the evaluation pipeline: the evaluation datasets and the OCR prompt templates. The design prioritizes organization, clarity, and the capture of essential metadata to support robust and repeatable experimentation. The architecture of these screens is designed to provide a structured environment that guides the user—primarily a Prompt Engineer or AI Developer—towards best practices in managing AI systems.

1.1 The Evaluation Hub (Main Dashboard)
The Evaluation Hub serves as the primary navigational anchor and at-a-glance summary for the system's technical users. Its purpose is to provide immediate situational awareness, offering quick access to ongoing evaluations, recent results, and key asset repositories. This screen is not merely a landing page but a functional control center that reflects the current state of the user's work.

Layout and Components
The main dashboard adopts a modern, card-based layout, a design pattern common in developer-focused tools that allows for the efficient display of heterogeneous information. A persistent vertical navigation sidebar on the left provides global access to the system's main sections:

Datasets: Navigates to the Evaluation Datasets Manager.

Prompt Library: Navigates to the Prompt Template Library.

Evaluations: Navigates to a historical list of all evaluation runs.

Batch Processing: Navigates to the simplified interface for production use.

API Portal: Navigates to the developer integration portal.

The main content area is populated with several key information cards:

Card 1: Active Evaluation Runs: This card provides real-time status for any evaluation jobs currently in progress. Each active run is listed with its user-defined name, a dynamic progress bar indicating the percentage of completion, and an estimated time remaining. This component relies on a persistent WebSocket connection to the backend, which pushes status updates as the job progresses through image batches. This immediate feedback is crucial for managing long-running tasks, preventing the user from feeling that their job is lost in a black box.

Card 2: Recent Evaluation Results: This card displays a list of the five most recently completed evaluation runs. Each entry shows the evaluation's name, the top-performing prompt's overall accuracy score, and the date of completion. A prominent "View Comparison" button serves as a direct shortcut to the detailed Evaluation Comparison Dashboard for that run, facilitating a quick transition from summary to analysis.

Card 3: Prompt Library Summary: This card offers a high-level overview of the state of the prompt repository. It displays key statistics, such as the total number of prompt families, and a breakdown of their status (e.g., 5 in "Production," 12 in "Draft"). This provides a quick measure of the system's maturity and readiness. A "Go to Library" link provides direct navigation.

Card 4: Dataset Overview: Similar to the prompt summary, this card summarizes the state of the ground truth data. It shows the total number of curated datasets and the aggregate count of images available for evaluation. A "Manage Datasets" link provides a shortcut to the Datasets Manager.

This dashboard design is a direct response to the typical workflow of a developer or engineer. Such users operate in what can be termed an "intermediate context," where their work involves frequent switching between distinct but related tasks—such as editing a prompt, selecting a dataset for testing, and then analyzing the results. The hub is architected to support this context switching seamlessly. Rather than forcing the user down a single, linear path, it presents a holistic view of the workspace and provides multiple, efficient entry points into the various facets of the evaluation-driven development cycle. The cards act as intelligent shortcuts, anticipating the user's next likely action and reducing the number of clicks required to perform common tasks, thereby enhancing overall productivity.

1.2 Screen Description: Evaluation Datasets Manager
The Evaluation Datasets Manager provides a robust and centralized interface for uploading, viewing, organizing, and curating the ground truth data. This data, consisting of handwritten Hindi image samples and their corresponding correct reference texts, forms the bedrock of the entire evaluation system. The quality and organization of these datasets directly impact the validity of any experimental results.

Layout and Components
The primary interface is a comprehensive table view that lists all available evaluation datasets, enabling efficient management of a potentially large collection of assets.

Toolbar Actions: A toolbar situated above the table provides the main actions for dataset creation and management.

"New Dataset" Button: This button initiates the process of adding a new dataset by opening a guided, multi-step modal window. This wizard-like approach minimizes user error during the critical ingestion phase.

Upload Workflow: The "New Dataset" modal walks the user through a structured process:

Define Metadata: The user first provides a unique Dataset Name and a Description to contextualize its purpose (e.g., "Class 4 Final Exam - Conjunct Characters Focus").

Image Upload: The user uploads a ZIP archive containing all the handwritten image files.

Reference Text Upload: The user uploads a corresponding CSV file. This file must contain two columns: image_filename and reference_text.

Validation: Upon submission, the backend performs a validation check to ensure that every image file within the ZIP archive has a corresponding entry in the CSV file, and vice-versa. This prevents data integrity issues that could invalidate evaluation results.

Dataset Detail View: Clicking on a dataset's name within the main table navigates the user to a dedicated detail page. This page is designed for quality control and manual verification. It features an interactive, paginated gallery displaying each image from the dataset. Alongside each image, its associated reference text is shown in an editable text field. This directly implements the system's requirement for a "Ground Truth Input Interface," allowing educators or annotators to review and correct the reference data, thereby improving the quality of the ground truth itself.

Table 1: Evaluation Datasets View
The main table in the Datasets Manager is designed to provide all the necessary metadata for a user to quickly understand, find, and select the appropriate dataset for a given evaluation task. The structure allows for easy sorting and filtering based on key attributes, which is essential when managing numerous datasets for diverse testing scenarios (e.g., testing matras, evaluating performance on different handwriting styles, or using class-specific samples).

Dataset Name

Description

Image Count

Status

Created Date

Last Used

Actions

Class 4 Final Exam

Samples from the final exam focusing on complex conjunct characters.

150

Validated

2024-07-15

2024-07-20

Edit Archive Download

New Student Onboarding

Initial handwriting samples from new students in September.

250

Validated

2024-07-12

2024-07-18

Edit Archive Download

Matra Drill Set

A curated set of images specifically to test matra recognition.

75

Draft

2024-07-10

-

Edit Archive Download

Legacy Exam 2023

Scanned images from last year's exams.

500

Archived

2024-06-01

2024-06-15

Unarchive Download

Export to Sheets
The columns in this table are carefully chosen to support the user's workflow. The Status column is particularly critical for maintaining high standards of quality control. By categorizing datasets as "Draft," "Validated," or "Archived," the system can enforce rules, such as allowing only "Validated" datasets to be used for definitive A/B tests that could lead to promoting a prompt to production. This prevents experiments from being run on incomplete or unverified data, ensuring the integrity of the evaluation process. The Last Used column provides context on the relevance and utility of a dataset, helping users identify which datasets are central to current testing efforts.

1.3 Screen Description: The Prompt Template Library
The Prompt Template Library is the central repository for creating, editing, and systematically versioning the OCR prompt templates. This screen is conceived as the primary "workbench" or "IDE" for the Prompt Engineer. It provides the tools necessary to craft, refine, and manage the lifecycle of prompts with the same rigor applied to software code.

Layout and Components
The interface utilizes a two-pane layout, a familiar pattern in development environments that optimizes for navigating a list of items while editing a specific one.

Left Pane: Prompt List: This pane contains a searchable and filterable list of all "prompt families." A prompt family is a collection of all versions related to a single conceptual prompt (e.g., "General Handwriting Prompt"). Each item in the list displays the prompt's name and, if applicable, the version number currently designated as "Production," offering a quick visual indicator of its status.

Right Pane: Editor and Version Management: This is the main interactive area where all development work occurs. It is organized with a tabbed interface to separate concerns.

Prompt Editor Tab: This tab features a rich text editor designed for writing and modifying the prompt text. To aid in development, it should support syntax highlighting for any templating variables the system uses (e.g., highlighting {{image_context}} or {{language_instructions}} in a distinct color). This visual feedback helps prevent syntax errors and makes the prompts more readable.

Version History Tab: This tab contains a chronological, tabular view of every saved version for the selected prompt family. This is the heart of the versioning system, providing a complete and auditable trail of the prompt's evolution.

Metadata Panel: A persistent side panel allows the user to edit the prompt's metadata, such as its Name, Description, and a system of Tags (e.g., "Hindi," "Cursive," "Beginner") for better organization and searchability.

The design of this library is a direct implementation of the principle that AI prompts should be managed as critical assets, akin to source code. A simple collection of text files in a folder is insufficient for a professional workflow where performance, reproducibility, and auditability are paramount. The UI must therefore enforce the discipline of structured versioning and status management.

When a user saves a change to a prompt, the system does not simply overwrite the existing version. Instead, it presents a dialog that requires the user to select a version increment based on Semantic Versioning (SemVer) principles: Major (for breaking changes that alter the prompt's fundamental structure), Minor (for adding new features or instructions without breaking compatibility), or Patch (for small fixes and tweaks). The user is also required to enter a concise, commit-style changelog message describing the nature of the update (e.g., "Added explicit instruction to handle visarga"). This process creates an unambiguous and meaningful audit trail, answering not just

what changed, but why it changed.

The Status field associated with each version is another critical component of this workflow. By allowing versions to be explicitly tagged as "Draft," "Staging," "Production," or "Archived," the system creates a formal promotion pipeline. This separation prevents experimental or untested prompts from being accidentally used in a production context, a key quality assurance feature.

Table 2: Prompt Template Version History
This table, located in the "Version History" tab, provides a complete, auditable history of every change made to a prompt. It is the user's primary tool for understanding a prompt's evolution, tracking its performance over time, and recovering from errors.

Version

Status

Changelog Message

Author

Timestamp

Last Eval Accuracy

Actions

v1.2.1

Draft

Patch: Corrected typo in an example.

A. Sharma

2024-07-21 11:45

-

View Run New Eval

v1.2.0

Production

Minor: Added explicit instructions for handling conjunct characters.

A. Sharma

2024-07-20 16:30

95.1%

View Run New Eval

v1.1.0

Archived

Minor: Initial attempt to improve matra recognition.

A. Sharma

2024-07-18 09:12

92.8%

View Restore Run New Eval

v1.0.0

Archived

Major: Initial baseline prompt for general Hindi text.

A. Sharma

2024-07-15 14:00

91.5%

View Restore Run New Eval

Export to Sheets
This historical view serves as an indispensable safety net. A Prompt Engineer will inevitably create a version that, despite good intentions, performs worse than its predecessor. This table allows them to immediately identify such regressions. The Last Eval Accuracy column provides a quick performance indicator, while the Changelog Message provides context for the change. If a new version is found to be faulty, the "Restore this Version" action allows the user to instantly roll back to a previously known good state, a critical capability for maintaining system reliability. Furthermore, the "Run New Evaluation" action provides a direct shortcut to the experimentation workflow, allowing the user to quickly launch a new test directly from a specific historical version.

Section 2: The Core Loop - Experimentation and Evaluation
This section details the user interface for the most critical part of the Prompt Engineer's workflow: configuring and running experiments, monitoring their execution in real-time, and analyzing the results in depth. The design of these screens prioritizes clarity in setup, immediate feedback during processing, and unparalleled analytical depth to support data-driven decision-making.

2.1 Screen Description: New Evaluation Run Configuration
This screen provides a guided, wizard-like interface for setting up a new evaluation run. Its primary purpose is to structure the configuration process, reducing the likelihood of errors and ensuring that all necessary parameters for a valid experiment, particularly a complex A/B test, are captured.

Layout and Components
The interface is structured as a multi-step form, breaking down the configuration into logical, manageable stages. This approach prevents cognitive overload and guides the user through the process systematically.

Step 1: General Information & Hypothesis:

The user begins by providing a descriptive Evaluation Name (e.g., "Conjuncts Test - v1.2 vs v1.3") and a more detailed Description.

Crucially, this step includes a mandatory "Hypothesis" text field. This design choice elevates the process from simple tinkering to a structured experiment. A/B testing best practices emphasize the importance of articulating a clear, testable hypothesis before running the test. By forcing the user to state their expectation, the system encourages more rigorous, goal-oriented experimentation. Placeholder text can guide the user, such as: "By changing the prompt to explicitly list examples of common matra errors (v1.3), we expect to reduce the 'Missing Matra' error rate by at least 20% on the 'Matra Drill Set' dataset." This hypothesis will be prominently displayed on the final results dashboard, providing essential context for the analysis.

Step 2: Select Dataset(s):

This step presents the user with a searchable and filterable list of available evaluation datasets. To ensure the quality of the experiment, this list is pre-filtered to show only datasets with a "Validated" status from the Datasets Manager. The user can select one or more datasets against which the prompts will be evaluated.

Step 3: Configure Prompts (A/B Test Setup):

This is the core of the experimental design. The interface presents a clear, side-by-side view for configuring the test variants. By default, it shows two columns: "Control (A)" and "Variation (B)." The user has the option to add more columns (C, D, etc.) for more complex multi-variant tests.

Within each column, the user selects a prompt template from the Prompt Library and, critically, a specific version of that prompt. This granularity is essential for precise A/B testing, allowing for comparisons like Prompt-A v1.2.0 (Control) against Prompt-A v1.3.0 (Variation), or even comparing two entirely different prompts like Prompt-A v1.2.0 and Prompt-B v2.1.0. This directly implements the foundational A/B testing methodology of comparing a control against one or more variations.

Step 4: Review & Launch:

The final step presents a comprehensive summary of all the user's selections: the evaluation name, the hypothesis, the chosen dataset(s), and the specific prompt versions configured for the test. This allows for a final review before committing to the run. A "Launch Evaluation" button initiates the process, sending the job to the backend for asynchronous processing.

2.2 Screen Description: Live Evaluation Monitor
Upon launching an evaluation, the user is automatically navigated to the Live Evaluation Monitor. This screen can also be accessed by clicking on an active run from the main dashboard hub. Its purpose is to provide transparent, real-time feedback on the progress of the long-running OCR job, assuring the user that the system is working and providing an estimate of completion time.

Layout and Components
The screen is designed for clarity and immediate comprehension of the job's status.

Overall Progress Bar: A prominent progress bar at the top of the screen displays the percentage of total images processed across all prompt variations. It provides an at-a-glance summary of the entire job's progress.

Per-Prompt Progress: For A/B tests, the UI displays a separate, labeled progress bar for each prompt version being evaluated. This allows the user to see if one variant is processing significantly slower than another, which could be an early indicator of a performance issue with a new prompt.

Live Log Stream (Collapsible Panel): At the bottom of the screen, a collapsible panel provides a stream of high-level, human-readable status updates from the backend workers. This is not a raw, verbose log dump, but rather a curated feed of key events. Example messages might include: "Job initiated," "Worker 1 processing batch 5/20," "Gemini API call initiated for image_xyz.jpg," or "Received response for image_xyz.jpg, parsing results." This provides a greater level of detail for interested users without cluttering the main interface.

Technical Implementation
This real-time monitoring capability is enabled by a specific backend architecture. Standard FastAPI BackgroundTasks are unsuitable for this use case, as they are designed to run after an HTTP response has been sent, which does not apply to an ongoing connection. Instead, the backend must leverage

asyncio.create_task() to spawn the long-running evaluation job in a separate, non-blocking task. This main task then communicates with the frontend via a WebSocket connection. As the evaluation job processes images, it periodically pushes progress updates (e.g., percentage complete, current batch number, ETA) through the WebSocket to the React frontend, which then updates the UI components in real time. This architecture is essential for handling computationally intensive, long-duration tasks like large-scale OCR processing while maintaining a responsive and informative user experience.

2.3 Screen Description: The Evaluation Comparison Dashboard
This dashboard is arguably the most critical and information-dense screen in the entire application. It is the primary environment for analyzing the results of a completed evaluation, comparing the performance of different prompt versions side-by-side, and making the data-driven decision of whether to promote a new prompt. The design synthesizes principles from A/B testing dashboards and developer-centric code review tools to create a powerful analytical experience.

Layout and Components
The layout is multi-pane and highly interactive, designed to feel like a professional analysis tool rather than a simple report.

Top Header: The header provides context for the entire view. It prominently displays the Evaluation Name, the Hypothesis that was stated during setup, and the Dataset(s) used for the test. This keeps the goal of the experiment top-of-mind during analysis.

Pane 1: Summary Metrics (The "Scoreboard"): This pane contains a high-level table that summarizes the aggregate performance of each prompt version tested. It provides the at-a-glance answer to the question, "Which prompt won?"

Pane 2: Interactive Diff Viewer (The "Microscope"): This is the main workspace for deep analysis. It consists of a detailed, paginated table showing the word-by-word comparison results for every image in the evaluation set.

Pane 3: Image and OCR Output Viewer: This pane is contextually linked to the Interactive Diff Viewer. When a user selects a specific row (representing a single word from an image) in the diff table, this pane updates dynamically. It displays the original handwritten image, the ground truth Reference Text, and the transcribed text generated by each of the prompt versions being compared. This allows for direct visual verification of the OCR output against the source image.

The overall workflow of this dashboard is modeled on the concept of a code pull request review, a paradigm that is highly intuitive for the target developer persona. The goal is to determine if a new "Variation" prompt is a meritorious improvement over the existing "Control" prompt. To support this, the UI frames the results accordingly. For instance, the summary metrics are not just presented as absolute values but also as deltas relative to the control. At the top of the page, two prominent, mutually exclusive action buttons drive the decision-making process:

"Promote to Production" and "Archive Experiment." Clicking "Promote" would update the winning prompt's status to "Production" in the Prompt Library, effectively merging the change. Clicking "Archive" concludes the experiment without promoting the new version, akin to closing a pull request without merging.

Table 3: A/B Test Results Summary Metrics
This table provides the quantitative "scoreboard" for the A/B test, allowing the user to quickly compare the high-level performance of the competing prompt versions.

Prompt Version

Overall Word Accuracy

Character Error Rate (CER)

Avg. Latency per Image (ms)

Estimated Cost / 1k Images

Error Breakdown (Chart)

v1.2.0 (Control)

92.8%

3.2%

800ms

$1.05

v1.3.0 (Variation)

95.1% (+2.3%)

2.4% (-0.8%)

850ms (+50ms)

$1.20 (+$0.15)

Export to Sheets
A purely accuracy-focused view is insufficient for real-world decision-making. Therefore, this summary includes other critical key performance indicators (KPIs).

Character Error Rate (CER) offers a more granular measure of accuracy. Avg. Latency and Estimated Cost are crucial operational metrics. A new prompt might be more accurate but unacceptably slow or expensive for production use. This table makes such trade-offs immediately visible. The Error Breakdown provides a visual summary of the types of errors each prompt makes, offering a clue as to where improvements or regressions occurred.

Table 4: Interactive Word-Level Diff Viewer
This interactive table is the core debugging tool, allowing the user to drill down from the aggregate metrics to the specific words and images where the prompts performed differently. An aggregate score like "95% accuracy" is not actionable on its own; to improve the prompt, the user must analyze the 5% of errors. This viewer, inspired by code diff tools , provides that necessary granular view.

Image Filename

Word Index

Reference Word

Control (v1.2.0) Output

Variation (v1.3.0) Output

Status

Error Type

img_001.jpg

3

विद्यालय

विदयालय

विद्यालय

Improved

Missing Matra

img_005.jpg

7

पुस्तक

पुस्तक

पुस्तक

Match

-

img_012.jpg

2

धर्म

धर्म

धम

Regression

Spelling

img_019.jpg

5

क्या

कया

कया

Mismatch

Spelling

Export to Sheets
Interactivity: The power of this table lies in its interactivity. A user evaluating a run with thousands of words does not need to see the instances where all prompts succeeded. The primary goal is to find the discrepancies. Therefore, the table includes a powerful set of filtering controls:

Filter by Status: "Show only 'Improved'," "Show only 'Regression'," "Show only rows where Variation output is different from Control."

Filter by Error Type: "Show only 'Missing Matra' errors," "Show only 'Segmentation' issues."

This ability to slice and dice the results allows the user to efficiently isolate patterns of failure or success. For example, a user might filter for all "Regression" cases to understand the negative impacts of their changes, or filter for all "Missing Matra" errors to validate if their hypothesis about improving matra recognition was successful. This targeted analysis is fundamental to the iterative prompt engineering workflow.

Section 3: Analysis and Auditing - Historical Insights and Diagnostics
This section describes the user interfaces designed for looking beyond a single experiment. These tools enable long-term performance tracking, the identification of systemic trends, and deep, low-level troubleshooting. They provide the necessary context to understand not just the outcome of one A/B test, but the overall health and trajectory of the AI system over time.

3.1 Screen Description: Historical Performance Dashboard
The Historical Performance Dashboard provides a longitudinal view of prompt performance, allowing users to track key metrics over time, identify long-term trends, and detect performance regressions that might not be apparent in a single, isolated A/B test.

Layout and Components
This screen is a classic analytics dashboard, dominated by data visualizations designed to reveal trends and patterns.

Global Filters: At the top of the dashboard, a set of filters allows the user to scope the entire view. Users can filter by a specific Prompt Family (to track the evolution of one prompt), a specific Dataset (to see how performance on a consistent test set has changed), and a Date Range.

Main Performance Chart: The central component is a line chart that plots Overall Word Accuracy on the Y-axis against Time on the X-axis. Each data point on the chart represents a completed evaluation run. The chart will display distinct lines for different prompt versions within the selected family, allowing for a visual comparison of their performance trajectories. Hovering over any data point reveals a tooltip with the specific evaluation details (e.g., "Evaluation: Matra Test v4, Version: v1.3.2, Accuracy: 95.4%"). Clicking on a data point navigates the user directly to the detailed Comparison Dashboard for that specific run.

Secondary Metric Charts: Below the main accuracy chart, a series of smaller charts provides trend data for other important metrics. These can include:

A line chart for Average Latency per Image over time, to track performance efficiency.

A stacked bar chart showing the Error Type Distribution over time, to see if changes are reducing certain types of errors while inadvertently increasing others.

A key function of this dashboard is to enable proactive regression detection, a specific requirement of the system. While the A/B test dashboard highlights regressions within a single experiment, this historical view can detect more subtle, systemic drift. For example, a silent update to the underlying Gemini model by the provider could cause a gradual degradation in performance across all prompts. To catch this, the system can automatically calculate and plot a moving average of accuracy for a given prompt-and-dataset combination. If a new evaluation result causes this moving average to drop below a user-defined threshold (e.g., a 2% drop over the last 5 runs), the system can visually flag the data point on the chart in red and generate an alert in a notification center. This transforms the dashboard from a passive reporting tool into an active quality assurance and monitoring system, providing an essential safeguard for maintaining production quality.

3.2 Screen Description: Unified Diagnostics Viewer
The Unified Diagnostics Viewer is a specialized interface designed for deep, advanced troubleshooting. It directly addresses the user requirement to "see the evals and actual processing logs in a similar manner" by providing a tightly integrated view that connects a high-level semantic error to the low-level system logs generated during its processing.

Layout and Components
This view is not a standalone page but is accessed contextually. Within the Interactive Word-Level Diff Viewer on the Comparison Dashboard, each row will have a "Diagnostics" icon. Clicking this icon opens the Unified Diagnostics Viewer in a modal window or a dedicated side panel, pre-loaded with the context of the selected error.

The layout is a split view designed to bridge the gap between the "what" and the "why" of an error.

Top Half: Evaluation Context: This section provides a focused summary of the specific error being investigated. It redisplays the relevant data from the selected diff viewer row: the source handwritten image, the Reference Word, and the differing OCR Outputs from the prompt versions. This keeps the high-level failure case—the "what"—constantly in view.

Bottom Half: Correlated Log Viewer: This section contains a fully-featured log viewing component. It is not a raw dump of all system logs. Instead, it is automatically and precisely filtered to show only the log entries associated with the processing of that specific image for that specific evaluation run.

The power of this screen is enabled by a critical piece of backend architecture: the use of correlated trace IDs. During an evaluation run, when the FastAPI backend begins processing an image, it must generate a unique traceId for that transaction. This traceId must then be injected into every log message related to that specific image's journey through the system (e.g., "API request prepared," "API call sent to Gemini," "API response received," "JSON parsing started," "Result stored in database"). This same traceId must also be stored in the database alongside the final evaluation result for that image-word combination.

When a user clicks the "Diagnostics" icon in the frontend, the UI passes the traceId associated with that specific error to a dedicated API endpoint. This endpoint then queries the centralized logging system (such as Grafana Loki or an ELK stack) for all log entries tagged with that exact traceId. The result is a perfectly correlated diagnostic view. The user can simultaneously see the high-level semantic error (e.g., the word 'विद्यालय' was incorrectly transcribed as 'विदयालय') and the low-level, time-stamped processing logs for that exact transaction. This allows them to debug whether the issue stemmed from a malformed API request, a slow or erroneous response from the Gemini API, an internal JSON parsing failure, or some other system-level problem. This seamless transition from semantic error to system log provides an unparalleled level of debuggability.

Log Viewer Features
The embedded log viewer itself is a powerful tool, incorporating best practices from dedicated log analysis platforms.

Search and Highlighting: A search bar allows the user to find and highlight keywords (e.g., "error," "timeout") within the filtered log stream.

Log Level Filtering: Toggles allow the user to filter the view by log severity (e.g., INFO, WARN, ERROR), helping to quickly isolate problem indicators.

Structured Display: Logs are displayed with clear timestamps, log levels, and the log message. If the logs are structured (e.g., JSON), the viewer can parse and display them in a readable, expandable format.

Context Expansion: While the default view is filtered by the traceId, options are available to "Show 10 lines before/after" to see the surrounding context if needed.

Copy and Export: Functionality to copy individual log lines or export the entire filtered log view for sharing or offline analysis is provided.

Section 4: Productionization and Application
This final section describes the user interfaces for the "consumers" of the evaluation pipeline's output. These screens are designed for two distinct user groups: educators or administrators who need to run assessments on student work, and developers who need to integrate the validated OCR service into other applications via an API. The design philosophy here is to abstract away the complexity of the underlying engineering workflow, providing simplified, task-oriented interfaces.

4.1 Screen Description: Batch Processing Interface
This interface is designed specifically for non-technical users, such as teachers and educational administrators. Its purpose is to provide a straightforward way to upload a batch of student handwriting samples and receive a processed assessment report. This UI deliberately hides the intricate details of prompt engineering, A/B testing, and evaluation metrics, presenting the AI system as a simple, reliable "appliance."

Layout and Components
The interface is a clean, single-page application with a simple, linear workflow.

Prompt Selector: The user is presented with a dropdown menu to select the OCR model they wish to use. This is the critical link to the entire engineering workflow. The dropdown is populated only with prompt templates from the Prompt Library that have been explicitly given the "Production" status. This design choice serves as a powerful abstraction layer and a quality gate. It ensures that educators can only use prompts that have been rigorously tested, validated, and approved by the engineering team.

File Uploader: A large, clearly marked drag-and-drop area allows the user to upload a ZIP archive containing the batch of student handwriting images. A conventional file selection button is also provided.

Reference Text Input: The user specifies the ground truth text for the assessment. Two options are provided to accommodate different use cases:

Upload CSV: For batches where each image has a different reference text, the user can upload a single CSV file mapping filenames to their correct text.

Manual Input: For assignments where all students were asked to write the same text, the user can simply type or paste that single reference text into a text area.

"Start Assessment" Button: A prominent button initiates the batch processing job. Once clicked, the UI provides clear feedback, such as a progress bar and a message indicating that the assessment is underway and the user will be notified upon completion.

Results View: After the job is complete, the user is presented with a simple, downloadable report. This is typically a CSV or PDF file that lists each student's image, the OCR-transcribed text, and a word-level accuracy score. It intentionally omits the complex A/B comparison dashboards and diagnostic tools available to engineers.

This separation of interfaces is a deliberate application of role-based design. The needs of a Prompt Engineer and an Educator are fundamentally different. The Engineer requires a complex "cockpit" with granular controls and deep analytics to build and refine the engine. The Educator, in contrast, needs a simple "appliance" that performs a specific task reliably and without confusion. Attempting to serve both personas with a single, unified UI would inevitably lead to an experience that is either too complex for the educator or too simplistic for the engineer. By creating distinct interfaces governed by Role-Based Access Control (RBAC), the system can provide an optimized and effective experience for each user group.

4.2 Screen Description: API Integration Portal
The API Integration Portal is a self-service resource hub for software developers who need to integrate the Hindi OCR service into their own applications. The design of this portal follows established conventions for developer-facing tools, aiming to provide clarity, comprehensive documentation, and interactive testing capabilities to minimize friction and reduce the need for direct support.

Layout and Components
The portal is structured like a typical developer documentation site, with clear navigation and content organized for easy access.

API Key Management: A secure section where authenticated developers can generate, view, copy, and revoke their API keys. This is the first step for any integration.

Interactive API Console: This is a crucial component for developer experience. The portal will feature an embedded interactive console, such as one generated by Swagger UI or OpenAPI. This tool allows developers to make live API calls directly from their browser. They can select the endpoint (e.g., /parse_image), enter their API key, upload a sample image, and see the exact raw JSON response from the server. This allows for immediate experimentation and understanding of the API's behavior without writing a single line of code.

Endpoint Documentation: Clear and concise documentation for the API endpoint(s). This includes:

The HTTP method and URL.

Details on the required headers (e.g., for authentication).

A description of the request payload (e.g., the multipart/form-data for image upload).

A detailed breakdown of the JSON response object, with data types and explanations for each field (e.g., transcribed_text, word_level_confidence, error_type).

A list of possible HTTP status codes and their meanings.

Code Snippets: To accelerate integration, the portal provides ready-to-use code examples for calling the API in several popular programming languages (e.g., Python using the requests library, JavaScript using fetch, etc.). Developers can copy and paste these snippets directly into their projects.

Usage Analytics: A simple dashboard provides developers with a view of their own API usage. This includes metrics like the number of calls made in a given period, a chart of usage over time, and a summary of any API errors (e.g., 4xx or 5xx responses) they have received. This helps them monitor their integration's health and costs.

This portal is designed to empower developers by providing them with all the tools and information they need to succeed independently. By adhering to familiar design patterns from platforms like AWS, Stripe, or Twilio, it creates an intuitive and efficient environment for the technical user.
