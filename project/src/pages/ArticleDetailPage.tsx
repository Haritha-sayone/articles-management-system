import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ThumbsUp, MessageSquare, Share2, Bookmark } from 'lucide-react';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

// Mock article data - In a real app, this would come from an API
const ARTICLE = {
  id: '1',
  title: 'Getting Started with React',
  content: `
    React is a powerful JavaScript library for building user interfaces. It allows you to create reusable UI components that manage their own state, making it easier to build complex applications.

    ## Key Concepts

    ### Components
    Components are the building blocks of any React application. They're like JavaScript functions that return HTML elements. Components can be either function components or class components.

    \`\`\`jsx
    function Welcome(props) {
      return <h1>Hello, {props.name}</h1>;
    }
    \`\`\`

    ### Props
    Props are inputs to components. They're like function arguments and allow you to pass data from parent to child components.

    ### State
    State is data that can change over time. When state changes, React efficiently updates and re-renders the component.

    ## Getting Started

    To start using React, you can create a new project using Create React App:

    \`\`\`bash
    npx create-react-app my-app
    cd my-app
    npm start
    \`\`\`

    This will set up a new React project with all the necessary build configuration handled for you.
  `,
  date: '2024-03-15',
  readTime: '5 min read',
  author: {
    id: '1',
    name: 'John Doe',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    bio: 'Senior Frontend Developer | React Expert | Technical Writer',
  },
  tags: ['React', 'JavaScript', 'Web Development', 'Frontend'],
  likes: 142,
  comments: 23,
  image: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
};

// Mock related articles
const RELATED_ARTICLES = [
  {
    id: '2',
    title: 'Advanced TypeScript Techniques',
    excerpt: 'Explore advanced TypeScript features to improve your code quality.',
    date: '2024-03-10',
    author: 'Jane Smith',
    image: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
  {
    id: '3',
    title: 'Building Responsive UIs with Tailwind CSS',
    excerpt: 'Learn how to create beautiful, responsive user interfaces using Tailwind CSS.',
    date: '2024-03-05',
    author: 'Alex Johnson',
    image: 'https://images.pexels.com/photos/5483077/pexels-photo-5483077.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
  },
];

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams();
  
  // In a real app, we would fetch the article data based on the ID
  const article = ARTICLE;
  
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link
            to="/articles"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Link>
          
          {/* Article header */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-64 object-cover"
            />
            
            <div className="p-6 sm:p-8">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              
              {/* Article meta */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <Avatar
                    src={article.author.avatar}
                    alt={article.author.name}
                    size="md"
                    className="mr-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{article.author.name}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <time>{format(new Date(article.date), 'MMM d, yyyy')}</time>
                      <span className="mx-2">·</span>
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  icon={<Bookmark className="h-4 w-4" />}
                >
                  Save
                </Button>
              </div>
              
              {/* Article content */}
              <div className="prose prose-blue max-w-none">
                {article.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Article actions */}
              <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    icon={<ThumbsUp className="h-4 w-4" />}
                  >
                    {article.likes}
                  </Button>
                  <Button
                    variant="outline"
                    icon={<MessageSquare className="h-4 w-4" />}
                  >
                    {article.comments}
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  icon={<Share2 className="h-4 w-4" />}
                >
                  Share
                </Button>
              </div>
            </div>
          </div>
          
          {/* Author bio */}
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">About the Author</h2>
            <div className="flex items-start">
              <Avatar
                src={article.author.avatar}
                alt={article.author.name}
                size="lg"
                className="mr-4"
              />
              <div>
                <h3 className="font-medium text-gray-900">{article.author.name}</h3>
                <p className="mt-1 text-gray-600">{article.author.bio}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Follow
                </Button>
              </div>
            </div>
          </div>
          
          {/* Related articles */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {RELATED_ARTICLES.map(article => (
                <Link
                  key={article.id}
                  to={`/articles/${article.id}`}
                  className="group block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{article.excerpt}</p>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <span>{article.author}</span>
                      <span className="mx-2">·</span>
                      <time>{format(new Date(article.date), 'MMM d, yyyy')}</time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailPage;