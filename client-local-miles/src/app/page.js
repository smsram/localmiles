// src/app/page.js
import HomePage from "./(marketing)/page";
import MarketingLayout from "./(marketing)/layout";

export default function Home() {
  return (
    <MarketingLayout>
      <HomePage />
    </MarketingLayout>
  );
}