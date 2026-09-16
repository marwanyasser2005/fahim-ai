export type LocalizedText = { ar: string; en: string };
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export type CourseLesson = {
  id: string;
  title: LocalizedText;
  duration: number;
  type: 'concept' | 'practice' | 'project';
};

export type CourseModule = {
  id: string;
  title: LocalizedText;
  lessons: CourseLesson[];
};

export type CourseResource = {
  title: string;
  url: string;
  kind: 'course' | 'docs' | 'book';
};

export type Course = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  category: LocalizedText;
  categoryKey: 'programming' | 'ai' | 'data' | 'web' | 'robotics' | 'iot';
  level: CourseLevel;
  weeks: number;
  rating: number;
  learners: number;
  image: string;
  outcomes: LocalizedText[];
  alignment: LocalizedText[];
  modules: CourseModule[];
  resources: CourseResource[];
};

const lesson = (id: string, ar: string, en: string, duration: number, type: CourseLesson['type'] = 'concept'): CourseLesson => ({ id, title: { ar, en }, duration, type });
const module = (id: string, ar: string, en: string, lessons: CourseLesson[]): CourseModule => ({ id, title: { ar, en }, lessons });
const text = (ar: string, en: string): LocalizedText => ({ ar, en });

export const courseCatalog: Course[] = [
  {
    id: 'python-foundations', title: text('أساسيات البرمجة مع Python', 'Programming foundations with Python'),
    description: text('مسار عملي يبدأ من التفكير الخوارزمي وينتهي ببناء برنامج يحل مشكلة حقيقية من مشكلات STEM.', 'A hands-on path from computational thinking to a Python program that solves a real STEM problem.'),
    category: text('البرمجة', 'Programming'), categoryKey: 'programming', level: 'beginner', weeks: 8, rating: 4.9, learners: 3500,
    image: 'https://images.pexels.com/photos/1181271/pexels-photo-1181271.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('تحويل المشكلة إلى خطوات قابلة للتنفيذ', 'Turn a problem into executable steps'), text('استخدام الأنواع والشروط والحلقات والدوال', 'Use types, conditions, loops, and functions'), text('اختبار وتصحيح برنامج Python', 'Test and debug a Python program')],
    alignment: [text('التفكير المنطقي وحل المشكلات', 'Logical reasoning and problem solving'), text('تطبيقات الرياضيات والفيزياء', 'Mathematics and physics applications')],
    modules: [
      module('thinking', 'فكّر كمبرمج', 'Think like a programmer', [lesson('problem', 'تحليل المشكلة والمدخلات', 'Problems, inputs, and outputs', 28), lesson('algorithms', 'الخوارزمية وشبه الكود', 'Algorithms and pseudocode', 35, 'practice')]),
      module('python', 'لغة Python', 'The Python language', [lesson('types', 'المتغيرات وأنواع البيانات', 'Variables and data types', 32), lesson('control', 'الشروط والحلقات', 'Conditions and loops', 45, 'practice')]),
      module('structure', 'بناء برامج موثوقة', 'Build reliable programs', [lesson('functions', 'الدوال وتقسيم المسؤوليات', 'Functions and separation of concerns', 40), lesson('debug', 'الاختبار والتصحيح', 'Testing and debugging', 42, 'practice')]),
      module('capstone', 'مشروع التخرج', 'Capstone', [lesson('model', 'نمذجة مسألة علمية', 'Model a scientific problem', 55, 'project'), lesson('ship', 'عرض المشروع وتوثيقه', 'Present and document the project', 50, 'project')]),
    ],
    resources: [{ title: 'CS50P — Harvard', url: 'https://cs50.harvard.edu/python/', kind: 'course' }, { title: 'Python Documentation', url: 'https://docs.python.org/3/tutorial/', kind: 'docs' }],
  },
  {
    id: 'machine-learning-science', title: text('تعلم الآلة للعلوم', 'Machine learning for science'),
    description: text('تعلّم دورة العمل الصحيحة للبيانات وابنِ نموذجًا يفسّر ويتنبأ بدل التعامل مع الذكاء الاصطناعي كصندوق أسود.', 'Learn a sound data workflow and build an interpretable predictive model instead of treating AI as a black box.'),
    category: text('الذكاء الاصطناعي', 'Artificial intelligence'), categoryKey: 'ai', level: 'intermediate', weeks: 9, rating: 4.8, learners: 1600,
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('إعداد البيانات وتجنب تسربها', 'Prepare data and prevent leakage'), text('اختيار مقياس تقييم مناسب', 'Choose an appropriate evaluation metric'), text('تفسير أخطاء النموذج وحدوده', 'Explain model errors and limitations')],
    alignment: [text('الإحصاء والاحتمالات', 'Statistics and probability'), text('المنهج العلمي وتصميم التجربة', 'Scientific method and experimental design')],
    modules: [
      module('data', 'من السؤال إلى البيانات', 'From question to data', [lesson('framing', 'صياغة مسألة قابلة للقياس', 'Frame a measurable problem', 35), lesson('cleaning', 'تنظيف البيانات واستكشافها', 'Clean and explore data', 48, 'practice')]),
      module('models', 'النماذج الأساسية', 'Core models', [lesson('regression', 'الانحدار والتنبؤ', 'Regression and prediction', 44), lesson('classification', 'التصنيف وحدود القرار', 'Classification and decision boundaries', 50, 'practice')]),
      module('evaluation', 'تقييم بلا خداع', 'Honest evaluation', [lesson('split', 'التدريب والتحقق والاختبار', 'Train, validation, and test sets', 38), lesson('metrics', 'المقاييس وتحليل الأخطاء', 'Metrics and error analysis', 46, 'practice')]),
      module('capstone', 'مشروع علمي', 'Science capstone', [lesson('experiment', 'تصميم التجربة', 'Design the experiment', 55, 'project'), lesson('report', 'تقرير النموذج المسؤول', 'Responsible model report', 50, 'project')]),
    ],
    resources: [{ title: 'scikit-learn User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', kind: 'docs' }, { title: 'Google Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', kind: 'course' }],
  },
  {
    id: 'arabic-nlp', title: text('معالجة اللغة الطبيعية العربية', 'Arabic natural language processing'),
    description: text('من تمثيل النص إلى Transformers مع اهتمام خاص بخصائص العربية وتقييم النماذج بإنصاف.', 'From text representation to Transformers, with special attention to Arabic and fair model evaluation.'),
    category: text('الذكاء الاصطناعي', 'Artificial intelligence'), categoryKey: 'ai', level: 'advanced', weeks: 10, rating: 4.8, learners: 1300,
    image: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('تهيئة النص العربي وتمثيله', 'Normalize and represent Arabic text'), text('استخدام Transformers لمهمة لغوية', 'Use Transformers for an NLP task'), text('تقييم الجودة والانحياز', 'Evaluate quality and bias')],
    alignment: [text('اللغة العربية وتحليل النص', 'Arabic language and text analysis'), text('الإحصاء التطبيقي', 'Applied statistics')],
    modules: [
      module('text', 'فهم النص حاسوبيًا', 'Text as data', [lesson('normalize', 'تطبيع العربية والتقطيع', 'Arabic normalization and tokenization', 45), lesson('vectors', 'من الكلمات إلى المتجهات', 'From words to vectors', 50, 'practice')]),
      module('tasks', 'المهام اللغوية', 'Language tasks', [lesson('classification', 'تصنيف النصوص', 'Text classification', 48), lesson('entities', 'استخراج الكيانات', 'Named entity recognition', 52, 'practice')]),
      module('transformers', 'نماذج Transformers', 'Transformers', [lesson('attention', 'الانتباه وبنية المحوّل', 'Attention and Transformer architecture', 55), lesson('finetune', 'الضبط الدقيق المسؤول', 'Responsible fine-tuning', 62, 'practice')]),
      module('capstone', 'مشروع عربي', 'Arabic NLP capstone', [lesson('dataset', 'بناء مجموعة تقييم', 'Build an evaluation set', 55, 'project'), lesson('model-card', 'بطاقة النموذج والحدود', 'Model card and limitations', 50, 'project')]),
    ],
    resources: [{ title: 'Hugging Face NLP Course', url: 'https://huggingface.co/learn/nlp-course/chapter1/1', kind: 'course' }, { title: 'Speech and Language Processing', url: 'https://web.stanford.edu/~jurafsky/slp3/', kind: 'book' }],
  },
  {
    id: 'computer-vision', title: text('الرؤية الحاسوبية', 'Computer vision'),
    description: text('افهم الصورة كبيانات، طبّق المعالجة الكلاسيكية، ثم درّب نظام كشف مع تحليل دقيق للأخطاء.', 'Understand images as data, apply classical processing, then build an object detector with rigorous error analysis.'),
    category: text('الذكاء الاصطناعي', 'Artificial intelligence'), categoryKey: 'ai', level: 'advanced', weeks: 11, rating: 4.9, learners: 1100,
    image: 'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('معالجة الصور باستخدام OpenCV', 'Process images with OpenCV'), text('تفسير الالتفاف والشبكات البصرية', 'Explain convolution and vision networks'), text('قياس أخطاء الكشف عمليًا', 'Measure detection errors in practice')],
    alignment: [text('البصريات والتمثيل الهندسي', 'Optics and geometric representation'), text('الاحتمالات وتحليل القياس', 'Probability and measurement analysis')],
    modules: [
      module('pixels', 'الصورة والقياس', 'Images and measurement', [lesson('pixels', 'البكسل واللون والإحداثيات', 'Pixels, color, and coordinates', 40), lesson('filters', 'المرشحات والحواف', 'Filters and edges', 48, 'practice')]),
      module('features', 'استخراج المعلومات', 'Extract information', [lesson('features', 'الملامح والمطابقة', 'Features and matching', 48), lesson('geometry', 'الهندسة والتحويلات', 'Geometry and transforms', 52, 'practice')]),
      module('deep', 'الرؤية العميقة', 'Deep vision', [lesson('cnn', 'الشبكات الالتفافية', 'Convolutional networks', 58), lesson('detection', 'كشف الأجسام', 'Object detection', 64, 'practice')]),
      module('capstone', 'نظام رؤية مسؤول', 'Responsible vision system', [lesson('dataset', 'البيانات والانحياز', 'Data and bias', 45), lesson('demo', 'بناء وعرض النموذج', 'Build and present the model', 70, 'project')]),
    ],
    resources: [{ title: 'OpenCV Tutorials', url: 'https://docs.opencv.org/4.x/d9/df8/tutorial_root.html', kind: 'docs' }, { title: 'PyTorch Vision Tutorials', url: 'https://pytorch.org/tutorials/intermediate/torchvision_tutorial.html', kind: 'course' }],
  },
  {
    id: 'iot-systems', title: text('إنترنت الأشياء والأنظمة الذكية', 'IoT and intelligent systems'),
    description: text('ابنِ منظومة حساس آمنة من القياس حتى لوحة المتابعة مع التفكير في الطاقة والخصوصية والاعتمادية.', 'Build a secure sensor system from measurement to dashboard, considering power, privacy, and reliability.'),
    category: text('إنترنت الأشياء', 'Internet of Things'), categoryKey: 'iot', level: 'intermediate', weeks: 7, rating: 4.7, learners: 1500,
    image: 'https://images.pexels.com/photos/163100/circuit-circuit-board-resistor-computer-163100.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('قراءة الحساسات ومعايرة القياس', 'Read sensors and calibrate measurements'), text('تصميم اتصال آمن للأجهزة', 'Design secure device communication'), text('بناء لوحة متابعة للبيانات', 'Build a telemetry dashboard')],
    alignment: [text('الكهرباء والإلكترونيات', 'Electricity and electronics'), text('القياس والطاقة', 'Measurement and energy')],
    modules: [
      module('sense', 'الاستشعار', 'Sensing', [lesson('circuits', 'الدوائر والحساسات', 'Circuits and sensors', 42), lesson('calibration', 'المعايرة وجودة القياس', 'Calibration and measurement quality', 45, 'practice')]),
      module('edge', 'البرمجة على الطرف', 'Edge programming', [lesson('controller', 'المتحكمات والمدخلات', 'Controllers and inputs', 48), lesson('reliability', 'الحالات والفشل الآمن', 'State and safe failure', 50, 'practice')]),
      module('network', 'الاتصال الآمن', 'Secure connectivity', [lesson('protocols', 'البروتوكولات والرسائل', 'Protocols and messages', 45), lesson('security', 'هوية الجهاز وحماية البيانات', 'Device identity and data protection', 52, 'practice')]),
      module('capstone', 'نظام ذكي', 'Smart-system capstone', [lesson('dashboard', 'لوحة القياسات', 'Telemetry dashboard', 55, 'project'), lesson('field', 'اختبار ميداني وتقرير', 'Field test and report', 60, 'project')]),
    ],
    resources: [{ title: 'Raspberry Pi Documentation', url: 'https://www.raspberrypi.com/documentation/', kind: 'docs' }, { title: 'Arduino Documentation', url: 'https://docs.arduino.cc/', kind: 'docs' }],
  },
  {
    id: 'data-science-python', title: text('علوم البيانات مع Python', 'Data science with Python'),
    description: text('حوّل البيانات الخام إلى قصة قابلة للتحقق باستخدام Pandas وNumPy والتصور وتحليل عدم اليقين.', 'Turn raw data into a verifiable story using Pandas, NumPy, visualization, and uncertainty analysis.'),
    category: text('علوم البيانات', 'Data science'), categoryKey: 'data', level: 'intermediate', weeks: 9, rating: 4.8, learners: 2300,
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('تنظيف وجدولة البيانات', 'Clean and reshape data'), text('اختيار تصور لا يضلل', 'Choose honest visualizations'), text('عرض استنتاج مدعوم بالأدلة', 'Present an evidence-backed conclusion')],
    alignment: [text('الإحصاء الوصفي والاستدلالي', 'Descriptive and inferential statistics'), text('البحث وتحليل المصادر', 'Research and source analysis')],
    modules: [
      module('questions', 'السؤال والبيانات', 'Questions and data', [lesson('questions', 'من الادعاء إلى سؤال بيانات', 'From claim to data question', 34), lesson('sources', 'المصادر وجودة البيانات', 'Sources and data quality', 42, 'practice')]),
      module('wrangle', 'Pandas وNumPy', 'Pandas and NumPy', [lesson('frames', 'الجداول والفهرسة', 'DataFrames and indexing', 48), lesson('clean', 'التنظيف والتحويل', 'Cleaning and transformation', 54, 'practice')]),
      module('explain', 'التحليل والتصور', 'Analysis and visualization', [lesson('stats', 'الإحصاء الوصفي', 'Descriptive statistics', 45), lesson('visuals', 'التصور الصادق', 'Honest visualization', 50, 'practice')]),
      module('capstone', 'قصة بيانات', 'Data-story capstone', [lesson('analysis', 'تحليل قابل لإعادة الإنتاج', 'Reproducible analysis', 65, 'project'), lesson('story', 'عرض النتيجة وحدودها', 'Present findings and limitations', 55, 'project')]),
    ],
    resources: [{ title: 'Pandas User Guide', url: 'https://pandas.pydata.org/docs/user_guide/', kind: 'docs' }, { title: 'NumPy Learn', url: 'https://numpy.org/learn/', kind: 'course' }],
  },
  {
    id: 'robotics-arduino', title: text('مقدمة في الروبوتات', 'Introduction to robotics'),
    description: text('ادمج الميكانيكا والإلكترونيات والبرمجة لبناء روبوت يتفاعل مع البيئة بأمان.', 'Combine mechanics, electronics, and programming to build a robot that safely interacts with its environment.'),
    category: text('الروبوتات', 'Robotics'), categoryKey: 'robotics', level: 'beginner', weeks: 6, rating: 4.8, learners: 1900,
    image: 'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('توصيل وقراءة مكونات Arduino', 'Wire and read Arduino components'), text('برمجة قرار حركي بسيط', 'Program a simple motion decision'), text('اختبار نموذج روبوتي وتوثيقه', 'Test and document a robot prototype')],
    alignment: [text('الميكانيكا والحركة', 'Mechanics and motion'), text('الدوائر والتحكم', 'Circuits and control')],
    modules: [
      module('system', 'الروبوت كنظام', 'The robot as a system', [lesson('parts', 'الحساس والمتحكم والمشغل', 'Sensors, controllers, and actuators', 35), lesson('safety', 'الطاقة والسلامة', 'Power and safety', 32, 'practice')]),
      module('arduino', 'برمجة Arduino', 'Arduino programming', [lesson('io', 'المداخل والمخارج', 'Inputs and outputs', 42), lesson('state', 'الحالة والتوقيت', 'State and timing', 48, 'practice')]),
      module('control', 'الحركة والتحكم', 'Motion and control', [lesson('motors', 'المحركات والاتجاه', 'Motors and direction', 46), lesson('feedback', 'التغذية الراجعة', 'Feedback control', 50, 'practice')]),
      module('capstone', 'تحدي الروبوت', 'Robot challenge', [lesson('build', 'بناء النموذج', 'Build the prototype', 70, 'project'), lesson('test', 'الاختبار والتحسين', 'Test and iterate', 60, 'project')]),
    ],
    resources: [{ title: 'Arduino Built-in Examples', url: 'https://docs.arduino.cc/built-in-examples/', kind: 'course' }, { title: 'Arduino Language Reference', url: 'https://docs.arduino.cc/language-reference/', kind: 'docs' }],
  },
  {
    id: 'full-stack-web', title: text('تطوير الويب الاحترافي', 'Professional web development'),
    description: text('ابنِ تطبيق ويب سريعًا ومتاحًا وآمنًا باستخدام React وواجهات API وقاعدة بيانات مع نشر إنتاجي.', 'Build a fast, accessible, secure web app with React, APIs, a database, and a production deployment.'),
    category: text('تطوير الويب', 'Web development'), categoryKey: 'web', level: 'intermediate', weeks: 10, rating: 4.9, learners: 3100,
    image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('بناء واجهة React متاحة', 'Build an accessible React interface'), text('تصميم API وقاعدة بيانات', 'Design an API and database'), text('اختبار ونشر تطبيق إنتاجي', 'Test and ship a production app')],
    alignment: [text('تصميم النظم وحل المشكلات', 'Systems design and problem solving'), text('الهوية الرقمية وأمن المعلومات', 'Digital identity and security')],
    modules: [
      module('web', 'أساسيات الويب', 'Web foundations', [lesson('html', 'HTML الدلالي وإمكانية الوصول', 'Semantic HTML and accessibility', 45), lesson('css', 'CSS المتجاوب ونظام التصميم', 'Responsive CSS and design systems', 52, 'practice')]),
      module('react', 'واجهات React', 'React interfaces', [lesson('components', 'المكونات وتدفق البيانات', 'Components and data flow', 52), lesson('state', 'الحالة والتفاعلات', 'State and interactions', 58, 'practice')]),
      module('backend', 'الخلفية والبيانات', 'Backend and data', [lesson('api', 'تصميم واجهات API', 'API design', 50), lesson('database', 'النمذجة والصلاحيات', 'Data modeling and authorization', 55, 'practice')]),
      module('ship', 'الجودة والنشر', 'Quality and shipping', [lesson('testing', 'الاختبار والأداء', 'Testing and performance', 55, 'practice'), lesson('capstone', 'نشر مشروع كامل', 'Ship a full-stack capstone', 80, 'project')]),
    ],
    resources: [{ title: 'MDN Learn Web Development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', kind: 'course' }, { title: 'React Documentation', url: 'https://react.dev/learn', kind: 'docs' }],
  },
  {
    id: 'applied-ai', title: text('الذكاء الاصطناعي التطبيقي', 'Applied artificial intelligence'),
    description: text('صمّم منتجًا مدعومًا بالذكاء الاصطناعي من تعريف المشكلة حتى التقييم والمراقبة والمسؤولية.', 'Design an AI-powered product from problem framing through evaluation, monitoring, and responsible use.'),
    category: text('الذكاء الاصطناعي', 'Artificial intelligence'), categoryKey: 'ai', level: 'advanced', weeks: 12, rating: 4.9, learners: 2100,
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('اختيار حل AI مناسب للمشكلة', 'Select an appropriate AI approach'), text('بناء مجموعة تقييم واقعية', 'Build a realistic evaluation set'), text('تحديد المخاطر وخطة المراقبة', 'Define risks and a monitoring plan')],
    alignment: [text('التفكير النقدي والمنهج العلمي', 'Critical thinking and scientific method'), text('الأخلاقيات والمواطنة الرقمية', 'Ethics and digital citizenship')],
    modules: [
      module('frame', 'تعريف المنتج', 'Product framing', [lesson('problem', 'المشكلة والمستخدم والبدائل', 'Problem, user, and alternatives', 42), lesson('success', 'مقاييس النجاح والفشل', 'Success and failure metrics', 45, 'practice')]),
      module('build', 'بناء النموذج الأولي', 'Build the prototype', [lesson('models', 'اختيار النموذج والبنية', 'Model and architecture selection', 50), lesson('grounding', 'السياق والأدوات والمصادر', 'Context, tools, and sources', 58, 'practice')]),
      module('evaluate', 'التقييم المسؤول', 'Responsible evaluation', [lesson('evals', 'سيناريوهات ومجموعة تقييم', 'Scenarios and evaluation set', 55), lesson('safety', 'الأمان والخصوصية والتحيز', 'Safety, privacy, and bias', 58, 'practice')]),
      module('operate', 'التشغيل والتحسين', 'Operate and improve', [lesson('monitor', 'المراقبة والتغذية الراجعة', 'Monitoring and feedback', 48), lesson('capstone', 'عرض منتج AI متكامل', 'Present an end-to-end AI product', 85, 'project')]),
    ],
    resources: [{ title: 'Google Machine Learning Rules', url: 'https://developers.google.com/machine-learning/guides/rules-of-ml', kind: 'book' }, { title: 'NIST AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework', kind: 'docs' }],
  },
  {
    // The only course whose completion is recorded server-side, which makes it the one that
    // can produce an evidence-backed credential. Lesson ids match the seeded rows in
    // supabase/migrations/20260915010000_course_completion_v1.sql exactly.
    id: 'physics-force-motion', title: text('أساسيات الفيزياء: القوة والحركة', 'Physics foundations: force and motion'),
    description: text('مسار قصير يعالج أشهر خطأ مفاهيمي في الميكانيكا — الخلط بين السرعة والتسارع — وينتهي بتقييم يُصحَّح على الخادم وشهادة إتمام موثّقة.', 'A short path that targets the most common mechanics misconception — confusing velocity with acceleration — ending in a server-graded assessment and a verifiable completion credential.'),
    category: text('العلوم', 'Science'), categoryKey: 'data', level: 'beginner', weeks: 1, rating: 4.9, learners: 480,
    image: 'https://images.pexels.com/photos/60582/newton-s-cradle-balls-sphere-action-60582.jpeg?auto=compress&cs=tinysrgb&w=1200',
    outcomes: [text('التمييز بين السرعة والتسارع والقوة', 'Tell velocity, acceleration, and force apart'), text('تفسير أثر الكتلة في العلاقة F = ma', 'Explain how mass changes F = ma'), text('تطبيق المفهوم على موقف جديد غير مألوف', 'Apply the concept to an unfamiliar situation')],
    alignment: [text('ميكانيكا المرحلة الثانوية', 'Secondary-school mechanics'), text('المنهج العلمي: فرضية ثم دليل', 'Scientific method: hypothesis then evidence')],
    modules: [
      module('motion', 'الحركة والقوة', 'Motion and force', [
        lesson('f1000000-0000-4000-8000-000000000101', 'القوة ليست سرعة', 'Force is not velocity', 22),
        lesson('f1000000-0000-4000-8000-000000000102', 'الكتلة تغيّر الاستجابة', 'Mass changes the response', 26, 'practice'),
      ]),
      module('apply', 'الفهم والتطبيق', 'Understand and apply', [
        lesson('f1000000-0000-4000-8000-000000000103', 'قراءة العلاقة F = ma', 'Reading the relation F = ma', 24),
        lesson('f1000000-0000-4000-8000-000000000104', 'تطبيق على موقف جديد', 'Applying it to a new situation', 30, 'project'),
      ]),
    ],
    resources: [{ title: 'OpenStax College Physics', url: 'https://openstax.org/details/books/college-physics-2e', kind: 'book' }, { title: 'NASA — Newton’s Laws', url: 'https://www.grc.nasa.gov/www/k-12/airplane/newton.html', kind: 'docs' }],
  },
];

export function getCourse(id?: string) {
  if (!id) return undefined;
  const legacy = Number(id);
  if (Number.isInteger(legacy) && legacy > 0) return courseCatalog[legacy - 1];
  return courseCatalog.find((course) => course.id === id);
}

export function courseMinutes(course: Course) {
  return course.modules.flatMap((item) => item.lessons).reduce((sum, item) => sum + item.duration, 0);
}
