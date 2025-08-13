# Checkout Hub

A clean and responsive web app to manage and organize checkout links for all your projects. Built with React, Vite, Tailwind CSS, and a real-time Firestore database.


## ✨ Features

-   **Project Organization:** Create, edit, and delete projects to group your links.
-   **Link Management:** Add, edit, and delete checkout links with titles and URLs for each project.
-   **Global Search:** Instantly search across all projects and links from a single input.
-   **Responsive Design:** A mobile-first interface that works beautifully on any device.
-   **Modal-driven UI:** A clean and focused user experience for adding and editing items.
-   **Real-time Database:** All data is synced instantly across devices using Firebase Firestore.
-   **Copy to Clipboard:** Easily copy any link with a single click.

## 🛠️ Tech Stack

-   **Frontend:** React (with Vite)
-   **Styling:** Tailwind CSS
-   **Database:** Google Firebase (Firestore)

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mayankkalra03/checkout-hub.git
    cd checkout-hub
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    -   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    -   Create a `.env` file in the root of the project.
    -   Add your Firebase project configuration to the `.env` file:
        ```env
        VITE_FIREBASE_API_KEY=YOUR_API_KEY
        VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
        VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
        VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
        VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
        VITE_FIREBASE_APP_ID=YOUR_APP_ID
        ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```