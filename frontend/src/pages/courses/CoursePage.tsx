import { Link, useParams } from 'react-router-dom';
import { COURSES, coursePath, findCourse } from '../../courses/catalog';
import { COURSE_LESSONS } from '../../courses/lessons';
import { SITE_NAME, SITE_URL } from '../../constant';
import { findToolByPath } from '../../tools';
import NotFoundPage from '../NotFoundPage';

export default function CoursePage() {
  const { slug = '' } = useParams();
  const course = findCourse(slug);
  if (!course) return <NotFoundPage homePath="/courses" homeLabel="Browse courses" />;
  const lessons = COURSE_LESSONS[course.slug];
  const nextCourse = COURSES[COURSES.indexOf(course) + 1];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Course',
        '@id': `${SITE_URL}${coursePath(course)}#course`,
        name: course.title,
        description: course.description,
        url: `${SITE_URL}${coursePath(course)}`,
        provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        isAccessibleForFree: true,
        inLanguage: 'en',
        educationalLevel: course.level,
        timeRequired: `PT${course.minutes}M`,
        dateModified: course.updated,
        teaches: course.outcomes,
        hasPart: lessons.map((lesson) => ({
          '@type': 'LearningResource',
          name: lesson.title,
          url: `${SITE_URL}${coursePath(course)}#${lesson.id}`,
          learningResourceType: 'Lesson',
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Courses', item: `${SITE_URL}/courses` },
          { '@type': 'ListItem', position: 3, name: course.title, item: `${SITE_URL}${coursePath(course)}` },
        ],
      },
    ],
  };

  return (
    <article className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link to="/" className="hover:text-blue-700">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link to="/courses" className="hover:text-blue-700">Courses</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-gray-700">{course.title}</li>
        </ol>
      </nav>
      <header className="max-w-3xl py-10">
        <p className="text-sm font-semibold text-blue-700">{course.category} · {course.level}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{course.title}</h1>
        <p className="mt-5 text-lg leading-8 text-gray-600">{course.description}</p>
        <p className="mt-5 text-sm text-gray-500">{lessons.length} lessons · About {course.minutes} minutes including practice · Free to read</p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
        <aside className="rounded-xl border border-gray-200 bg-gray-50 p-5 lg:sticky lg:top-6">
          <nav aria-label="Course lessons">
            <h2 className="font-semibold">In this course</h2>
            <ol className="mt-4 space-y-4 text-sm">
              {lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <a href={`#${lesson.id}`} className="flex gap-3 text-gray-600 hover:text-blue-700">
                    <span className="font-semibold text-blue-600">{String(index + 1).padStart(2, '0')}</span>
                    <span>{lesson.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-6 border-t border-gray-200 pt-5">
            <h2 className="text-sm font-semibold">Tools you will use</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {course.toolPaths.map((path) => (
                <li key={path}><Link to={path} className="text-blue-700 hover:underline">Open {findToolByPath(path)?.name} <span aria-hidden="true">↗</span></Link></li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-gray-500">An API key is needed to run the tools. Your provider may charge for usage.{course.toolPaths.includes('/document-ai') ? ' These exercises need a Google Gemini key.' : ''}</p>
          </div>
        </aside>

        <div className="min-w-0">
          <section aria-labelledby="outcomes-heading" className="rounded-xl border border-blue-100 bg-blue-50 p-6">
            <h2 id="outcomes-heading" className="text-lg font-semibold">What you will learn</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">
              {course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
            </ul>
          </section>

          {lessons.map((lesson, index) => (
            <section id={lesson.id} key={lesson.id} aria-labelledby={`${lesson.id}-heading`} className="scroll-mt-6 border-b border-gray-200 py-10">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Lesson {index + 1} of {lessons.length}</p>
              <h2 id={`${lesson.id}-heading`} className="mt-2 text-2xl font-bold tracking-tight">{lesson.title}</h2>
              {lesson.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-7 text-gray-600">{paragraph}</p>)}
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold">Worked example</h3>
                <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-6 text-gray-700">{lesson.example}</pre>
              </div>
              <h3 className="mt-6 font-semibold">Try it yourself</h3>
              <p className="mt-2 leading-7 text-gray-600">{lesson.exercise}</p>
              <h3 className="mt-5 font-semibold">Check your result</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-600">
                {lesson.checks.map((check) => <li key={check}>{check}</li>)}
              </ul>
            </section>
          ))}

          <section className="py-10">
            <h2 className="text-2xl font-bold tracking-tight">Put it into practice</h2>
            <p className="mt-3 leading-7 text-gray-600">Repeat one exercise with your own material. Keep the original beside the result, use the lesson’s checklist and revise the input if something is missing.</p>
            <div className="mt-6 flex flex-wrap gap-4">
              {nextCourse && <Link to={coursePath(nextCourse)} className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Next: {nextCourse.title}</Link>}
              <Link to="/courses" className="rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">All courses</Link>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
