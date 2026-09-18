import { Link } from 'react-router-dom';
import CourseCard from '../../components/CourseCard';
import { COURSES, coursePath } from '../../courses/catalog';
import { SITE_NAME, SITE_URL } from '../../constant';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Free AI courses',
  url: `${SITE_URL}/courses`,
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: COURSES.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.title,
        description: course.description,
        url: `${SITE_URL}${coursePath(course)}`,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        isAccessibleForFree: true,
      },
    })),
  },
};

export default function CoursesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <section className="border-b border-gray-200 bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-sm font-semibold text-blue-700">Learn with Nevatal</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Build skills you can use in your next AI task.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            Short, practical courses for the tools in your workspace. Follow a worked example,
            try the exercise and learn what to check before using the result.
          </p>
          <p className="mt-6 text-sm font-medium text-gray-600">{COURSES.length} free courses · Self-paced · No API key needed to read</p>
          <Link to={coursePath(COURSES[0])} className="mt-8 inline-block rounded-md bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            Start with prompting
          </Link>
        </div>
      </section>
      <section aria-labelledby="course-list-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 id="course-list-heading" className="text-2xl font-bold tracking-tight">Choose a course</h2>
            <p className="mt-2 text-gray-600">Start with the basics, or go straight to the task you have in mind.</p>
          </div>
          <span className="text-sm text-gray-500">20–35 minutes each</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((course) => <CourseCard key={course.slug} course={course} />)}
        </div>
        <aside className="mt-10 rounded-xl border border-blue-100 bg-blue-50 p-6 text-sm leading-6 text-gray-700">
          <h2 className="font-semibold text-gray-900">Read freely. Practice when you are ready.</h2>
          <p className="mt-2">Every lesson and example is free to read. Running an exercise in an AI tool requires your own provider API key and may incur provider charges. Document AI and Image Generation exercises require Google Gemini.</p>
        </aside>
      </section>
    </>
  );
}
