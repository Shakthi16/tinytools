export const categories = [
  'All tools',
  'PDF & documents',
  'Text & writing',
  'Image & media',
  'Developer',
  'Security & privacy',
  'Calculators',
  'Business & everyday',
  'Social media',
  'Productivity',
] as const;

export type Category = (typeof categories)[number];

export type Tool = {
  id: string;
  name: string;
  description: string;
  howToUse: string[];
  category: Category;
  icon: string;
  color: string;
  popular?: boolean;
};

export const tools: Tool[] = [
  // --- PDF & DOCUMENTS ---
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one clean document — with full page-order control. Works 100% in your browser; nothing is uploaded.',
    howToUse: [
      'Click or drag-and-drop to add two or more PDF files.',
      'Reorder files using the ↑ ↓ arrows. Drag to rearrange.',
      'Click "Merge PDFs" — the combined file downloads instantly.',
    ],
    category: 'PDF & documents',
    icon: 'pdf',
    color: 'pink',
    popular: true,
  },
  {
    id: 'pdf-split',
    name: 'Split & extract PDF',
    description: 'Pull out exactly the pages you need — enter individual page numbers or ranges like "1-3, 5, 8-10". Zero uploads, zero waiting.',
    howToUse: [
      'Upload the PDF file you want to extract pages from.',
      'Type page numbers or ranges in the box, e.g. "1-3, 5, 8-10".',
      'Click "Download Extracted PDF" — only your selected pages are saved.',
    ],
    category: 'PDF & documents',
    icon: 'split',
    color: 'yellow',
    popular: true,
  },
  {
    id: 'images-to-pdf',
    name: 'Images to PDF converter',
    description: 'Turn JPG or PNG photos into a multi-page PDF in seconds — great for scanned receipts, notes, or photo albums. No account needed.',
    howToUse: [
      'Click to choose one or more JPG/PNG images (or pick multiple at once).',
      'Choose page format: A4, US Letter, or "Fit to photo" for native size.',
      'Click "Convert to PDF" — a ready-to-share PDF downloads instantly.',
    ],
    category: 'PDF & documents',
    icon: 'file',
    color: 'mint',
  },
  {
    id: 'pdf-sign',
    name: 'PDF sign & annotate',
    description: 'Draw a freehand signature with your mouse or finger, or type your name in a script font. Download as a transparent PNG to paste onto any document.',
    howToUse: [
      'Choose "Draw Signature" to sign with mouse/touch, or "Type Signature" to enter your name.',
      'Adjust ink color and stroke width to your preference.',
      'Click "Download Transparent PNG" — paste it onto any document or PDF.',
    ],
    category: 'PDF & documents',
    icon: 'signature',
    color: 'sky',
  },

  // --- POPULAR EVERYDAY FAVORITES ---
  {
    id: 'word-counter',
    name: 'Word & character counter',
    description: 'See live word count, character count, sentences, paragraphs, reading time, speaking time, and top keyword density — all as you type.',
    howToUse: [
      'Paste or type your text into the editor — stats update instantly.',
      'Highlight any sentence to see its individual word and character count.',
      'Set a target word limit or adjust reading/speaking speed from the settings panel.',
    ],
    category: 'Text & writing',
    icon: 'text',
    color: 'pink',
    popular: true,
  },
  {
    id: 'image-resizer',
    name: 'Image resizer & converter',
    description: 'Resize photos to any pixel dimension or percentage, convert between JPG, PNG, and WebP, and adjust quality — all locally, no upload.',
    howToUse: [
      'Drop or click to upload your image (JPG, PNG, WebP, or GIF).',
      'Set the target width/height in pixels, or choose a percentage scale.',
      'Pick output format and quality, then click Download.',
    ],
    category: 'Image & media',
    icon: 'image',
    color: 'lime',
    popular: true,
  },
  {
    id: 'image-compressor',
    name: 'Target KB image compressor',
    description: 'Compress a photo down to a specific file size limit — e.g. 50 KB, 100 KB, or 200 KB — perfect for government portals and job applications.',
    howToUse: [
      'Upload your photo (JPG or PNG).',
      'Pick a preset target (50 KB, 100 KB, 200 KB) or type a custom KB limit.',
      'Click Compress — a JPEG that fits under your cap downloads automatically.',
    ],
    category: 'Image & media',
    icon: 'image',
    color: 'mint',
    popular: true,
  },
  {
    id: 'qr-generator',
    name: 'QR code generator & customizer',
    description: 'Generate high-res QR codes for URLs, Wi-Fi networks, and UPI payments. Customize colors and download a 512 px PNG instantly.',
    howToUse: [
      'Choose a mode: URL/Text, Wi-Fi Network, or UPI Payment.',
      'Fill in the relevant details (link, SSID & password, or UPI ID).',
      'Optionally change pattern/background colors, then click Download.',
    ],
    category: 'Image & media',
    icon: 'qr',
    color: 'yellow',
    popular: true,
  },
  {
    id: 'password-generator',
    name: 'Password generator & tester',
    description: 'Generate cryptographically secure passwords using your browser\'s true-random API. See live entropy score and strength rating.',
    howToUse: [
      'Drag the length slider (6–64 characters) to set password length.',
      'Toggle character sets: uppercase, lowercase, numbers, symbols.',
      'Click the refresh icon to regenerate; click Copy to grab it.',
    ],
    category: 'Security & privacy',
    icon: 'key',
    color: 'lime',
    popular: true,
  },
  {
    id: 'json-formatter',
    name: 'JSON formatter & validator',
    description: 'Paste raw JSON to instantly validate syntax, prettify with 2 or 4-space indentation, or minify. Error messages show exact position.',
    howToUse: [
      'Paste your JSON into the text area.',
      'Click "Prettify (2 spaces)" or "Prettify (4 spaces)" to format it.',
      'A green banner confirms valid JSON; red shows the error location.',
    ],
    category: 'Developer',
    icon: 'code',
    color: 'yellow',
    popular: true,
  },
  {
    id: 'invoice-generator',
    name: 'Invoice & quote generator',
    description: 'Build a professional invoice with line items, quantities, rates, and tax — then print it or save as PDF with one click.',
    howToUse: [
      'Fill in your name, client name, and invoice number.',
      'Add line items (description, quantity, rate) using "Add Line Item".',
      'Set a tax percentage, then click "Print or Save as PDF".',
    ],
    category: 'Business & everyday',
    icon: 'invoice',
    color: 'lime',
    popular: true,
  },
  {
    id: 'unit-converter',
    name: 'Universal unit converter',
    description: 'Convert instantly between length, weight/mass, temperature, digital data size, and area units. Results update live as you type.',
    howToUse: [
      'Pick a category tab: Length, Weight, Temperature, Digital Data, or Area.',
      'Select the "From" and "To" units from the dropdowns.',
      'Type your value — the converted result appears instantly.',
    ],
    category: 'Calculators',
    icon: 'scale',
    color: 'mint',
    popular: true,
  },

  // --- SECURITY & PRIVACY ---
  {
    id: 'hash-generator',
    name: 'Hash & checksum generator',
    description: 'Compute SHA-256, SHA-512, and SHA-1 hashes of any text. Paste an expected hash to instantly verify whether it matches.',
    howToUse: [
      'Type or paste the text you want to hash into the input box.',
      'SHA-1, SHA-256, and SHA-512 hashes appear instantly below.',
      'Paste a reference hash into the "Verify" field — green means match.',
    ],
    category: 'Security & privacy',
    icon: 'security',
    color: 'sky',
  },
  {
    id: 'text-encrypt',
    name: 'Text encrypt & decrypt',
    description: 'Encrypt sensitive text with AES-GCM 256-bit using a passphrase of your choice. Decrypt it again with the same passphrase — all in-browser.',
    howToUse: [
      'Type your secret message in the "Plaintext" box and enter a strong passphrase.',
      'Click "Encrypt (AES-GCM)" — a Base64 ciphertext block appears on the right.',
      'To decrypt: paste the ciphertext, enter the passphrase, click "Decrypt".',
    ],
    category: 'Security & privacy',
    icon: 'lock',
    color: 'pink',
  },

  // --- DEVELOPER & CODE ---
  {
    id: 'base64-tool',
    name: 'Base64 & URL encoder',
    description: 'Encode plain text to Base64 or URL-encode it for safe use in URLs and HTTP headers. Supports Unicode / UTF-8 text.',
    howToUse: [
      'Choose mode: "Base64 Mode" or "URL Encode Mode".',
      'Type or paste raw text on the left — encoded output appears on the right.',
      'Click "Decode Input from Base64/URL" to reverse-convert.',
    ],
    category: 'Developer',
    icon: 'binary',
    color: 'mint',
  },
  {
    id: 'jwt-decoder',
    name: 'JWT token decoder',
    description: 'Decode any JSON Web Token to inspect its Header, Payload claims, algorithm, and expiry status — without verifying the signature.',
    howToUse: [
      'Paste your JWT token (the long eyJ… string) into the text box.',
      'Header and Payload sections expand automatically below.',
      'A badge shows whether the token is Active, Expired, or has no expiry.',
    ],
    category: 'Developer',
    icon: 'verify',
    color: 'sky',
  },
  {
    id: 'diff-checker',
    name: 'Text difference checker',
    description: 'Paste two versions of any text into the side-by-side editors — changed lines are highlighted red (removed) and green (added) instantly.',
    howToUse: [
      'Paste the original text on the left and the modified text on the right.',
      'Changed lines are highlighted automatically — red for removed, green for added.',
      'Unchanged lines show in plain text for context.',
    ],
    category: 'Developer',
    icon: 'diff',
    color: 'pink',
  },
  {
    id: 'uuid-generator',
    name: 'UUID & ULID generator',
    description: 'Generate 1–25 cryptographically random RFC-compliant v4 UUIDs at once. Toggle uppercase/lowercase and strip hyphens for compact IDs.',
    howToUse: [
      'Choose the quantity (1, 5, 10, or 25) from the dropdown.',
      'Toggle "Uppercase" or "Hyphens" to format IDs as you need.',
      'Click "Copy All" or the copy icon next to any individual UUID.',
    ],
    category: 'Developer',
    icon: 'key',
    color: 'lime',
  },
  {
    id: 'unix-timestamp',
    name: 'Unix timestamp converter',
    description: 'Convert an Epoch timestamp to UTC, local, and ISO 8601 dates — or pick a human date to get the corresponding Unix seconds.',
    howToUse: [
      'Type an epoch number in the top field (seconds or milliseconds).',
      'UTC, local, and ISO 8601 formats appear instantly below.',
      'Or pick a datetime from the date picker at the bottom, then click "Convert to Epoch".',
    ],
    category: 'Developer',
    icon: 'clock',
    color: 'yellow',
  },
  {
    id: 'svg-sanitizer',
    name: 'SVG code sanitizer',
    description: 'Remove malicious scripts, event handlers, and external references from SVG code — safe to embed in HTML without XSS risks.',
    howToUse: [
      'Paste SVG markup into the input box.',
      'Click "Sanitize" — unsafe attributes and scripts are stripped.',
      'Copy the clean SVG output to use safely in your HTML or email.',
    ],
    category: 'Developer',
    icon: 'code',
    color: 'lime',
  },
  {
    id: 'json-checklist',
    name: 'JSON to checklist',
    description: 'Convert any JSON array or object into an interactive checklist you can tick through — great for review steps and onboarding lists.',
    howToUse: [
      'Paste a JSON array or object into the input box.',
      'A clickable checklist renders from your data automatically.',
      'Tick items off as you go — state is tracked locally.',
    ],
    category: 'Developer',
    icon: 'check',
    color: 'yellow',
  },
  {
    id: 'emoji-favicon',
    name: 'Emoji favicon maker',
    description: 'Turn any emoji into a browser-tab favicon without a single image editor. Download a 32×32 PNG ready to link in your HTML.',
    howToUse: [
      'Pick or paste an emoji in the input field.',
      'A live preview of the tab favicon appears.',
      'Click "Download Favicon PNG" — link it from your HTML <head>.',
    ],
    category: 'Developer',
    icon: 'smile',
    color: 'pink',
  },
  {
    id: 'border-radius',
    name: 'Border-radius playground',
    description: 'Drag 8 individual corner handles to craft asymmetric CSS border-radius shapes and copy the ready-to-use CSS value instantly.',
    howToUse: [
      'Drag any of the 8 corner handles to adjust the shape.',
      'The CSS property updates live in the output box.',
      'Click "Copy CSS" to paste the value directly into your stylesheet.',
    ],
    category: 'Developer',
    icon: 'shapes',
    color: 'sky',
  },
  {
    id: 'html-entities',
    name: 'HTML entity converter',
    description: 'Encode special characters (&, <, >, ", ©, ™, etc.) into HTML entities — or decode entities back to readable text.',
    howToUse: [
      'Paste text with special characters into the input box.',
      'Click "Encode to HTML Entities" or "Decode from Entities".',
      'Copy the safe output for use in HTML templates or emails.',
    ],
    category: 'Developer',
    icon: 'code',
    color: 'yellow',
  },

  // --- TEXT & WRITING ---
  {
    id: 'markdown-clean',
    name: 'Markdown to clean text',
    description: 'Strip all Markdown syntax (**, ##, [], etc.) and return pure readable plain text — ideal for pasting into plain-text editors or emails.',
    howToUse: [
      'Paste Markdown-formatted text into the left editor.',
      'Click "Strip Markdown" — clean plain text appears on the right.',
      'Copy the result or download it as a .txt file.',
    ],
    category: 'Text & writing',
    icon: 'file',
    color: 'mint',
  },
  {
    id: 'markdown-rich',
    name: 'Markdown to rich text',
    description: 'Convert Markdown to beautifully rendered HTML, then copy it as rich text — preserves formatting in Google Docs, Gmail, and Word.',
    howToUse: [
      'Paste Markdown into the left editor.',
      'The formatted preview renders on the right in real time.',
      'Click "Copy Rich Text" to paste into Google Docs or Outlook with full formatting.',
    ],
    category: 'Text & writing',
    icon: 'file',
    color: 'sky',
  },
  {
    id: 'prompt-debloater',
    name: 'Prompt de-bloater',
    description: 'Remove AI-generated fluff — em dashes, hollow filler phrases, and overused buzzwords — to get clean, direct human-sounding text.',
    howToUse: [
      'Paste text generated by an AI tool into the input box.',
      'Click "De-bloat" — filler words and clichés are stripped.',
      'Review and copy the tightened output.',
    ],
    category: 'Text & writing',
    icon: 'sparkles',
    color: 'yellow',
  },
  {
    id: 'smart-quotes',
    name: 'Smart quote converter',
    description: 'Convert curly "smart" quotes (\u201c\u201d \u2018\u2019) to straight quotes (" \') — essential before pasting into code, config files, or terminals.',
    howToUse: [
      'Paste text containing curly/smart quotes into the editor.',
      'Click "Straighten Quotes" — all curly quotes become standard ASCII.',
      'Copy the clean result.',
    ],
    category: 'Text & writing',
    icon: 'quote',
    color: 'pink',
  },
  {
    id: 'case-cleaner',
    name: 'Case alternator & cleaner',
    description: 'Transform text between UPPER CASE, lower case, Title Case, camelCase, snake_case, kebab-case, and more — with one click each.',
    howToUse: [
      'Type or paste your text in the input field.',
      'Click the transformation button you need (e.g. "snake_case" or "UPPER").',
      'Transformed text appears instantly — click Copy to grab it.',
    ],
    category: 'Text & writing',
    icon: 'text',
    color: 'mint',
  },
  {
    id: 'list-sorter',
    name: 'Alphabetical list sorter',
    description: 'Paste any line-separated list and sort it A–Z or Z–A, optionally removing duplicates and trimming whitespace.',
    howToUse: [
      'Paste your list (one item per line) into the input box.',
      'Click "Sort A–Z" or "Sort Z–A".',
      'Toggle "Remove Duplicates" if needed, then copy the cleaned list.',
    ],
    category: 'Text & writing',
    icon: 'list',
    color: 'yellow',
  },
  {
    id: 'duplicate-remover',
    name: 'Duplicate line remover',
    description: 'Remove repeated lines from any list while keeping the original order. Case-sensitive or case-insensitive matching available.',
    howToUse: [
      'Paste your list with duplicates into the input box.',
      'Click "Remove Duplicates" — repeated lines are eliminated.',
      'Toggle "Case-insensitive" to treat "Apple" and "apple" as the same.',
    ],
    category: 'Text & writing',
    icon: 'copy',
    color: 'lime',
  },
  {
    id: 'find-replace',
    name: 'Find & replace',
    description: 'Perform bulk find-and-replace across large text — supports plain text and regular expressions (regex). Results highlighted inline.',
    howToUse: [
      'Paste your text into the editor.',
      'Enter a search term and the replacement text.',
      'Toggle "Regex" for pattern matching, then click "Replace All".',
    ],
    category: 'Text & writing',
    icon: 'search',
    color: 'sky',
  },

  // --- SOCIAL MEDIA ---
  {
    id: 'caption-counter',
    name: 'Caption & hashtag counter',
    description: 'Track character counts against Instagram (2,200), X/Twitter (280), LinkedIn (3,000), TikTok (2,200), and YouTube (5,000) limits.',
    howToUse: [
      'Paste or type your caption in the text box.',
      'Live counters for each platform appear below the editor.',
      'A red bar marks which platforms are over their limit.',
    ],
    category: 'Social media',
    icon: 'hash',
    color: 'yellow',
    popular: true,
  },
  {
    id: 'link-cleaner',
    name: 'Clean link redirector',
    description: 'Strip UTM tracking parameters, fbclid, gclid, and other trackers from URLs — get a clean, shareable link that doesn\'t follow you.',
    howToUse: [
      'Paste any URL with tracking parameters into the input.',
      'Click "Clean URL" — all known tracker params are removed.',
      'Copy the clean URL to share privately.',
    ],
    category: 'Social media',
    icon: 'link',
    color: 'sky',
    popular: true,
  },
  {
    id: 'instagram-spacer',
    name: 'Instagram grid spacer',
    description: 'Add invisible line breaks to Instagram captions so they actually show as new paragraphs after posting — not collapsed into one block.',
    howToUse: [
      'Write or paste your caption with line breaks in the editor.',
      'Click "Apply Instagram Spacing" — invisible spacers are inserted.',
      'Copy the result and paste directly into Instagram.',
    ],
    category: 'Social media',
    icon: 'text',
    color: 'mint',
  },
  {
    id: 'thread-previewer',
    name: 'X thread previewer',
    description: 'Write a long post and split it into numbered tweet-sized chunks — see how your thread will look before you post it.',
    howToUse: [
      'Paste your full long-form text into the input box.',
      'The tool splits it at 280 characters and numbers each tweet.',
      'Review the thread preview and copy individual tweets.',
    ],
    category: 'Social media',
    icon: 'message',
    color: 'sky',
  },
  {
    id: 'carousel-splitter',
    name: 'Carousel splitter',
    description: 'Upload a wide panoramic image and split it into perfectly aligned slide panels for Instagram or LinkedIn carousels.',
    howToUse: [
      'Upload a wide (landscape) image file.',
      'Set the number of slides (2–10).',
      'Click "Split into slides" — download each panel individually.',
    ],
    category: 'Social media',
    icon: 'layers',
    color: 'pink',
  },
  {
    id: 'teleprompter',
    name: 'Script to teleprompter',
    description: 'Paste your video script and read it in auto-scrolling teleprompter mode — adjust speed, font size, and mirror flip for camera setups.',
    howToUse: [
      'Paste your script into the text box.',
      'Adjust scroll speed and font size using the sliders.',
      'Click "Start Teleprompter" — the text scrolls at your set pace.',
    ],
    category: 'Social media',
    icon: 'video',
    color: 'lime',
  },

  // --- IMAGE & MEDIA ---
  {
    id: 'passport-photo',
    name: 'Passport & ID photo maker',
    description: 'Auto-crop your portrait to US (2×2\"), Indian/OCI (35×45 mm), or Schengen/EU (35×45 mm) specs and tile onto a standard 4×6 inch print sheet.',
    howToUse: [
      'Upload a clear front-facing portrait photo.',
      'Select the country specification (US, India, or Schengen/EU).',
      'Click "Generate 4×6 Print Sheet" — download and print at a photo lab.',
    ],
    category: 'Image & media',
    icon: 'id',
    color: 'pink',
  },
  {
    id: 'color-picker',
    name: 'Color picker from image',
    description: 'Click anywhere on an uploaded photo to instantly sample the exact HEX color at that pixel — no extensions or external tools needed.',
    howToUse: [
      'Upload any photo (JPG, PNG, WebP, or GIF).',
      'Click any spot on the image to sample its color.',
      'The HEX code appears instantly — click "Copy hex" to grab it.',
    ],
    category: 'Image & media',
    icon: 'pipette',
    color: 'yellow',
  },
  {
    id: 'exif-stripper',
    name: 'Image metadata stripper',
    description: 'Re-export your photo as a clean PNG with all EXIF metadata removed — GPS coordinates, camera make/model, serial numbers, timestamps.',
    howToUse: [
      'Upload your photo (JPG, PNG, WebP, or GIF).',
      'Click "Download metadata-free PNG" — the image is re-encoded without any metadata.',
      'The downloaded PNG contains zero embedded location or camera data.',
    ],
    category: 'Image & media',
    icon: 'shield',
    color: 'pink',
  },
  {
    id: 'media-converter',
    name: 'Screen recording compressor',
    description: 'Compress a screen recording or audio clip to a smaller WebM file by re-encoding it through your browser\'s MediaRecorder API. No upload.',
    howToUse: [
      'Upload a video or audio file (MP4, MOV, WebM, MP3, etc.).',
      'Click "Convert to WebM" and let the recording play through.',
      'Download the compressed WebM when conversion finishes.',
    ],
    category: 'Image & media',
    icon: 'video',
    color: 'mint',
  },

  // --- CALCULATORS & FINANCE ---
  {
    id: 'loan-calculator',
    name: 'EMI & loan calculator',
    description: 'Calculate your monthly EMI using the standard amortization formula. See total interest paid and total amount payable over the loan tenure.',
    howToUse: [
      'Enter loan amount, annual interest rate (%), and tenure in years.',
      'Monthly EMI, total interest, and total payment update instantly.',
      'Adjust any field to compare different loan scenarios.',
    ],
    category: 'Calculators',
    icon: 'calculator',
    color: 'sky',
  },
  {
    id: 'sip-calculator',
    name: 'SIP & compound interest',
    description: 'Forecast the maturity value of a monthly SIP investment using the compound interest formula. Compare invested vs. estimated gains.',
    howToUse: [
      'Enter your monthly investment amount, expected annual return (%), and tenure in years.',
      'Total invested, estimated returns, and maturity value appear instantly.',
      'Adjust inputs to plan your retirement or savings goal.',
    ],
    category: 'Calculators',
    icon: 'currency',
    color: 'lime',
  },
  {
    id: 'gst-calculator',
    name: 'GST & VAT tax calculator',
    description: 'Calculate GST or VAT-inclusive / exclusive amounts instantly. Supports standard slabs (5%, 12%, 18%, 28%) and custom tax rates.',
    howToUse: [
      'Choose "Add GST (Exclusive)" or "Remove GST (Inclusive)".',
      'Enter the base or total amount and select the tax slab.',
      'Net base, tax amount, and gross total are displayed instantly.',
    ],
    category: 'Calculators',
    icon: 'receipt',
    color: 'yellow',
  },
  {
    id: 'bmi-calculator',
    name: 'BMI & daily calorie calculator',
    description: 'Calculate your Body Mass Index (BMI), Basal Metabolic Rate (BMR), and daily calorie maintenance (TDEE) using the Mifflin-St Jeor formula.',
    howToUse: [
      'Enter your height (cm), weight (kg), age, and gender.',
      'BMI score, category, BMR at rest, and TDEE update instantly.',
      'Use TDEE as your daily maintenance calorie target for diet planning.',
    ],
    category: 'Calculators',
    icon: 'scale',
    color: 'pink',
  },
  {
    id: 'percentage',
    name: 'Percentage quick-grid',
    description: 'Answer common percentage questions: X% of Y, what % is X of Y, and percentage change from X to Y — all at once.',
    howToUse: [
      'Enter Number X and Number Y in the fields.',
      'Click "Calculate" — three percentage results appear simultaneously.',
      'Use this to work out discounts, score percentages, or growth rates.',
    ],
    category: 'Calculators',
    icon: 'percent',
    color: 'yellow',
  },
  {
    id: 'age-calculator',
    name: 'Age & milestone calculator',
    description: 'Enter a date of birth to see exact age in years, months, and days — plus total days lived, minutes lived, and days until the next birthday.',
    howToUse: [
      'Pick or type the date of birth.',
      'Click "Calculate" — exact age, days lived, and birthday countdown appear.',
      'Great for visa applications, anniversaries, or just curiosity.',
    ],
    category: 'Calculators',
    icon: 'gift',
    color: 'pink',
  },
  {
    id: 'tip-splitter',
    name: 'Tip & bill splitter',
    description: 'Enter a total bill amount, choose a tip percentage, and split equally between any number of people. Handles custom tip rates too.',
    howToUse: [
      'Enter the total bill amount.',
      'Choose a tip percentage (0%, 10%, 15%, 20%, or custom).',
      'Enter number of people — per-person amount, total tip, and total bill appear instantly.',
    ],
    category: 'Calculators',
    icon: 'receipt',
    color: 'lime',
  },
  {
    id: 'date-difference',
    name: 'Days between dates',
    description: 'Find the exact number of calendar days and business days between two dates — useful for deadlines, countdowns, and project planning.',
    howToUse: [
      'Choose a start date and an end date.',
      'Click "Calculate" — total days, weeks, and weekdays appear.',
      'Use the weekdays count to exclude weekends from project timelines.',
    ],
    category: 'Calculators',
    icon: 'calendar',
    color: 'sky',
  },

  // --- BUSINESS & EVERYDAY ---
  {
    id: 'whatsapp-link',
    name: 'WhatsApp direct link builder',
    description: 'Generate a wa.me click-to-chat link with a pre-filled message — no need to save the number. Includes a scannable QR code for offline sharing.',
    howToUse: [
      'Enter the phone number with country code (digits only, e.g. 919876543210).',
      'Type the pre-filled message that will open in WhatsApp.',
      'Copy the link or scan the QR code — clicking it opens a chat instantly.',
    ],
    category: 'Business & everyday',
    icon: 'message',
    color: 'mint',
  },
  {
    id: 'scratchpad',
    name: 'Private autosaving scratchpad',
    description: 'A distraction-free note editor that auto-saves every keystroke to your browser\'s local storage. Nothing leaves your device.',
    howToUse: [
      'Start typing — notes are saved automatically to your browser.',
      'Close and reopen the page — your notes are still there.',
      'Click "Export as Markdown" to download a .md file, or "Copy Notes" to grab the text.',
    ],
    category: 'Business & everyday',
    icon: 'notes',
    color: 'sky',
  },

  // --- PRODUCTIVITY ---
  {
    id: 'pomodoro',
    name: 'Pomodoro focus timer',
    description: 'A distraction-free interval timer with 25-minute Focus, 5-minute Short Break, and 15-minute Long Break modes. A gentle chime rings when time is up.',
    howToUse: [
      'Click "Focus", "Short break", or "Long break" to set the mode.',
      'Press Start — the countdown begins.',
      'A chime plays when the session ends. Click the speaker icon to test the sound.',
    ],
    category: 'Productivity',
    icon: 'timer',
    color: 'pink',
    popular: true,
  },
  {
    id: 'stopwatch',
    name: 'Stopwatch & lap timer',
    description: 'Millisecond-precision stopwatch with lap recording. Press Lap while running to record splits — all displayed in reverse chronological order.',
    howToUse: [
      'Click "Start" to begin timing.',
      'Click "Lap" at any point to record a split time.',
      'Click "Pause" to stop, then "Start" again to resume. "Reset" clears everything.',
    ],
    category: 'Productivity',
    icon: 'timer',
    color: 'yellow',
  },
  {
    id: 'timezone',
    name: 'Time zone meeting planner',
    description: 'See what time a meeting is in up to 3 cities simultaneously. Pick a local date/time or check the live current time across all zones.',
    howToUse: [
      'Choose up to 3 cities from the dropdowns.',
      'Leave the time blank to see current time, or pick a meeting time.',
      'The local time in each city updates instantly — no mental math needed.',
    ],
    category: 'Productivity',
    icon: 'globe',
    color: 'mint',
  },
];

export function toolHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — Tiny Tools` },
      { name: 'description', content: description },
      { property: 'og:title', content: `${title} — Tiny Tools` },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  };
}

export function getToolById(id: string): Tool | undefined {
  return tools.find((tool) => tool.id === id);
}

export function getToolsByCategory(category: Category): Tool[] {
  return tools.filter((tool) => tool.category === category);
}
