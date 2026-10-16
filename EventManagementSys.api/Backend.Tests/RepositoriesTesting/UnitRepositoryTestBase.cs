using System.Linq.Expressions;
using EventManagementSys.api.Data;
using EventManagementSys.api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Moq;

namespace EventManagementSys.api.Tests.Repositories;

public abstract class UnitRepositoryTestBase
{
    protected AppDbContext Context { get; }

    protected UnitRepositoryTestBase()
    {
        var context = new Mock<AppDbContext>(new DbContextOptions<AppDbContext>());
        context.Setup(db => db.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        Context = context.Object;

        Context.Users = CreateSet<User>();
        Context.Organizations = CreateSet<Organization>();
        Context.Venues = CreateSet<Venue>();
        Context.Events = CreateSet<Event>();
        Context.Employees = CreateSet<Employee>();
        Context.Attendees = CreateSet<Attendee>();
        Context.EventEmployees = CreateSet<EventEmployee>();
        Context.EventAttendees = CreateSet<EventAttendee>();
    }

    private static DbSet<T> CreateSet<T>() where T : class
    {
        var items = new List<T>();
        IQueryable<T> query = items.AsQueryable();
        var set = new Mock<DbSet<T>>();

        set.As<IAsyncEnumerable<T>>()
            .Setup(source => source.GetAsyncEnumerator(It.IsAny<CancellationToken>()))
            .Returns((CancellationToken _) => new TestAsyncEnumerator<T>(query.GetEnumerator()));
        set.As<IQueryable<T>>().Setup(source => source.Provider)
            .Returns(new TestAsyncQueryProvider<T>(query.Provider));
        set.As<IQueryable<T>>().Setup(source => source.Expression).Returns(query.Expression);
        set.As<IQueryable<T>>().Setup(source => source.ElementType).Returns(query.ElementType);
        set.As<IQueryable<T>>().Setup(source => source.GetEnumerator()).Returns(() => query.GetEnumerator());

        set.Setup(source => source.Add(It.IsAny<T>())).Returns((T entity) =>
        {
            AssignIdentity(entity, items.Count + 1);
            items.Add(entity);
            return null!;
        });
        set.Setup(source => source.AddAsync(It.IsAny<T>(), It.IsAny<CancellationToken>()))
            .Returns((T entity, CancellationToken _) =>
            {
                AssignIdentity(entity, items.Count + 1);
                items.Add(entity);
                return ValueTask.FromResult<Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<T>>(null!);
            });
        set.Setup(source => source.AddRange(It.IsAny<IEnumerable<T>>())).Callback((IEnumerable<T> entities) =>
        {
            foreach (T entity in entities)
            {
                AssignIdentity(entity, items.Count + 1);
                items.Add(entity);
            }
        });
        set.Setup(source => source.AddRange(It.IsAny<T[]>())).Callback((T[] entities) =>
        {
            foreach (T entity in entities)
            {
                AssignIdentity(entity, items.Count + 1);
                items.Add(entity);
            }
        });
        set.Setup(source => source.Update(It.IsAny<T>())).Returns((T entity) =>
        {
            if (!items.Contains(entity)) items.Add(entity);
            return null!;
        });
        set.Setup(source => source.Remove(It.IsAny<T>())).Returns((T entity) =>
        {
            items.Remove(entity);
            return null!;
        });

        return set.Object;
    }

    private static void AssignIdentity<T>(T entity, int value)
    {
        string? propertyName = entity switch
        {
            User => nameof(User.UserId),
            Organization => nameof(Organization.OrgId),
            Venue => nameof(Venue.VenueId),
            Event => nameof(Event.EventId),
            Employee => nameof(Employee.EmployeeId),
            Attendee => nameof(Attendee.AttendeeId),
            EventEmployee => nameof(EventEmployee.AssignmentId),
            _ => null,
        };

        if (propertyName is not null)
        {
            var property = typeof(T).GetProperty(propertyName)!;
            if ((int)property.GetValue(entity)! == 0) property.SetValue(entity, value);
        }
    }

    private sealed class TestAsyncQueryProvider<TEntity>(IQueryProvider innerProvider) : IAsyncQueryProvider
    {
        public IQueryable CreateQuery(Expression expression)
        {
            Type elementType = expression.Type.GetGenericArguments().First();
            return (IQueryable)Activator.CreateInstance(typeof(TestAsyncEnumerable<>).MakeGenericType(elementType), expression)!;
        }

        public IQueryable<TElement> CreateQuery<TElement>(Expression expression) => new TestAsyncEnumerable<TElement>(expression);
        public object? Execute(Expression expression) => innerProvider.Execute(expression);
        public TResult Execute<TResult>(Expression expression) => innerProvider.Execute<TResult>(expression);

        public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken cancellationToken = default)
        {
            Type resultType = typeof(TResult).GetGenericArguments()[0];
            object? result = typeof(IQueryProvider).GetMethods()
                .Single(method => method.Name == nameof(IQueryProvider.Execute) && method.IsGenericMethod)
                .MakeGenericMethod(resultType)
                .Invoke(innerProvider, [expression]);
            return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))!
                .MakeGenericMethod(resultType).Invoke(null, [result])!;
        }
    }

    private sealed class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
    {
        public TestAsyncEnumerable(IEnumerable<T> items) : base(items) { }
        public TestAsyncEnumerable(Expression expression) : base(expression) { }
        IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
        public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default) =>
            new TestAsyncEnumerator<T>(((IEnumerable<T>)this).GetEnumerator());
    }

    private sealed class TestAsyncEnumerator<T>(IEnumerator<T> innerEnumerator) : IAsyncEnumerator<T>
    {
        public T Current => innerEnumerator.Current;
        public ValueTask<bool> MoveNextAsync() => ValueTask.FromResult(innerEnumerator.MoveNext());
        public ValueTask DisposeAsync()
        {
            innerEnumerator.Dispose();
            return ValueTask.CompletedTask;
        }
    }
}
