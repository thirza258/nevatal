import { Link } from 'react-router-dom';
import { coursePath, type Course } from '../courses/catalog';

export default function CourseCard({ course }: { course: Course }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 transition-colors hover:border-blue-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{course.category}</p>
      <h3 className="mt-3 text-xl font-semibold tracking-tight">
        <Link to={coursePath(course)} className="rounded-sm text-gray-900 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
          {course.title}
        </Link>
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{course.description}</p>
      <p className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500">
        {course.level} · About {course.minutes} min · Free
      </p>
    </article>
  );
}
