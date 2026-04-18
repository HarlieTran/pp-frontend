# Deploying PantryPal Frontend to AWS Amplify

This guide walks you through deploying the `pp-frontend` application to AWS Amplify Hosting. We have already included an `amplify.yml` file in the root of this folder to tell AWS exactly how to build the app.

## Step 1: Connect Your Repository

1. Push your latest code (including the `amplify.yml` file) to your Git repository (GitHub, GitLab, or Bitbucket).
2. Log into the **AWS Management Console** and navigate to **AWS Amplify**.
3. Scroll down to the **Amplify Hosting** section and click **Get Started** or **Host your web app**.
4. Select your Git provider (e.g., GitHub) and click **Continue**.
5. Authorize AWS to access your repositories, then select your `PantryPay_V3` repository and the branch you want to deploy (e.g., `main`).

## Step 2: Configure Build Settings

1. Since your frontend and backend are in the same repository, check the box for **"Connecting a monorepo?"**.
2. Enter `pp-frontend` as the **Root directory**.
3. AWS will automatically detect the `amplify.yml` file located in this folder.
4. Expand the **Advanced Settings** section to configure Environment Variables. You must add the following variables so the build process can inject them into the production React app:
   - `VITE_API_URL` (Your AWS API Gateway URL)
   - `VITE_COGNITO_USER_POOL_ID` (Your AWS Cognito User Pool ID)
   - `VITE_COGNITO_CLIENT_ID` (Your AWS Cognito Client ID)
5. Click **Next** and then **Save and deploy**.

## Step 3: Configure Single Page Application (SPA) Routing

Because React/Vite handles routing on the client-side, we must tell AWS Amplify to redirect all incoming requests to `index.html`. Without this step, users refreshing a page like `/pantry` will receive a 404 error.

1. In the Amplify Console for your newly created app, click on **Hosting > Rewrites and redirects** on the left-hand menu.
2. Click **Manage rules**.
3. Click **Open text editor** and replace the contents with the following JSON:
   ```json
   [
     {
       "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>",
       "status": "200",
       "target": "/index.html"
     }
   ]
   ```
4. Click **Save**.

## Step 4: Verification

Wait a few minutes for the initial build and deployment to complete. Once finished, click on the provided `https://<branch>.<appid>.amplifyapp.com` link to view your live frontend.

Ensure that:
1. The app successfully connects to your backend APIs.
2. You can authenticate using Cognito.
3. Refreshing the page on a non-root route (e.g., `/settings`) works properly without returning a 404 error.

---

## Alternative: Deploy via Script (Without Git)

If you prefer to deploy manually without pushing your code to Git, you can use the AWS CLI to package and deploy your frontend directly. 

We have included a sample PowerShell script, `deploy-manual.ps1`, which automates this process:
1. Compiles the React/Vite project (`npm run build`).
2. Zips the resulting `dist` folder.
3. Uploads the zip file to a temporary S3 bucket.
4. Triggers AWS Amplify to deploy the uploaded zip file.

**Usage:**
1. Open `deploy-manual.ps1` and update the `$APP_ID` and `$S3_BUCKET` variables with your actual AWS Amplify App ID and an S3 staging bucket name.
2. Run the script in your terminal: `.\deploy-manual.ps1`
