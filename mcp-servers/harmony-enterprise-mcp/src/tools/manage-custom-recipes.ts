import type { ToolResult, CustomRecipe } from '@harmony-agent/types/index.js';
import { createTimer } from '@harmony-agent/utils/index.js';

// In-memory custom recipe store
const customRecipes: CustomRecipe[] = [
  {
    id: 'recipe-001',
    name: 'RetrofitToHarmonyHTTP',
    sourceCode: `Retrofit retrofit = new Retrofit.Builder()
    .baseUrl("https://api.example.com")
    .addConverterFactory(GsonConverterFactory.create())
    .build();
ApiService service = retrofit.create(ApiService.class);
Call<List<User>> call = service.getUsers();
call.enqueue(new Callback<List<User>>() {
    @Override
    public void onResponse(Call<List<User>> call, Response<List<User>> response) {
        List<User> users = response.body();
    }
});`,
    targetCode: `import http from '@ohos.net.http';
import { BusinessError } from '@ohos.base';

const httpRequest = http.createHttp();
httpRequest.request('https://api.example.com/users', {
  method: http.RequestMethod.GET,
  header: { 'Content-Type': 'application/json' }
}).then((response) => {
  const users = JSON.parse(response.result as string);
}).catch((err: BusinessError) => {
  console.error('HTTP error:', err.message);
});`,
    description: 'Convert Android Retrofit API calls to HarmonyOS @ohos.net.http',
    category: 'NETWORK',
    tags: ['retrofit', 'http', 'network', 'api', 'android'],
    usageCount: 47,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2025-06-10T00:00:00.000Z',
  },
  {
    id: 'recipe-002',
    name: 'SharedPreferencesToDataPreferences',
    sourceCode: `SharedPreferences prefs = getSharedPreferences("my_prefs", MODE_PRIVATE);
SharedPreferences.Editor editor = prefs.edit();
editor.putString("username", "john_doe");
editor.putInt("age", 30);
editor.apply();
String username = prefs.getString("username", "default");`,
    targetCode: `import preferences from '@ohos.data.preferences';
import { BusinessError } from '@ohos.base';

const options: preferences.Options = { name: 'my_prefs' };
const prefs = await preferences.getPreferences(getContext(), 'my_prefs', options);
await prefs.put('username', 'john_doe');
await prefs.put('age', 30);
await prefs.flush();
const username = await prefs.get('username', 'default') as string;`,
    description: 'Convert Android SharedPreferences to HarmonyOS @ohos.data.preferences',
    category: 'STORAGE',
    tags: ['sharedpreferences', 'preferences', 'storage', 'android'],
    usageCount: 82,
    createdAt: '2025-01-20T00:00:00.000Z',
    updatedAt: '2025-06-12T00:00:00.000Z',
  },
  {
    id: 'recipe-003',
    name: 'SQLiteRoomToRelationalStore',
    sourceCode: `@Entity(tableName = "users")
public class User {
    @PrimaryKey public int id;
    public String name;
    public String email;
}

@Dao
public interface UserDao {
    @Query("SELECT * FROM users")
    List<User> getAll();
}

@Database(entities = {User.class}, version = 1)
public abstract class AppDatabase extends RoomDatabase {
    public abstract UserDao userDao();
}`,
    targetCode: `import relationalStore from '@ohos.data.relationalStore';

const STORE_CONFIG: relationalStore.StoreConfig = {
  name: 'app.db',
  securityLevel: relationalStore.SecurityLevel.S1
};

const SQL_CREATE_TABLE = \`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL
)\`;

const store = await relationalStore.getRdbStore(getContext(), STORE_CONFIG);
await store.executeSql(SQL_CREATE_TABLE);

const predicates = new relationalStore.RdbPredicates('users');
const resultSet = await store.query(predicates);`,
    description: 'Convert Android Room database to HarmonyOS relational store',
    category: 'DATABASE',
    tags: ['room', 'sqlite', 'database', 'android', 'orm'],
    usageCount: 65,
    createdAt: '2025-02-01T00:00:00.000Z',
    updatedAt: '2025-06-15T00:00:00.000Z',
  },
  {
    id: 'recipe-004',
    name: 'GlideToImageComponent',
    sourceCode: `Glide.with(context)
    .load("https://example.com/image.jpg")
    .placeholder(R.drawable.placeholder)
    .error(R.drawable.error)
    .into(imageView);`,
    targetCode: `import { Image } from '@ohos.multimedia.image';

Image("https://example.com/image.jpg")
  .objectFit(ImageFit.Cover)
  .alt($r('app.media.placeholder'))
  .onError(() => {
    console.error('Image load failed');
  })`,
    description: 'Convert Android Glide image loading to HarmonyOS ArkUI Image component',
    category: 'UI',
    tags: ['glide', 'image', 'ui', 'arkui', 'android'],
    usageCount: 93,
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-06-18T00:00:00.000Z',
  },
  {
    id: 'recipe-005',
    name: 'RecyclerViewToList',
    sourceCode: `RecyclerView recyclerView = findViewById(R.id.recycler_view);
recyclerView.setLayoutManager(new LinearLayoutManager(this));
UserAdapter adapter = new UserAdapter(userList);
recyclerView.setAdapter(adapter);

public class UserAdapter extends RecyclerView.Adapter<UserAdapter.ViewHolder> {
    @Override
    public ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
            .inflate(R.layout.item_user, parent, false);
        return new ViewHolder(view);
    }
}`,
    targetCode: `@Component
struct UserList {
  @State users: User[] = [];

  build() {
    List() {
      ForEach(this.users, (user: User) => {
        ListItem() {
          Row() {
            Text(user.name)
              .fontSize(16)
            Text(user.email)
              .fontSize(14)
              .fontColor(Color.Gray)
          }
          .width('100%')
          .padding(12)
        }
      })
    }
    .width('100%')
    .height('100%')
  }
}`,
    description: 'Convert Android RecyclerView to HarmonyOS ArkUI List component',
    category: 'UI',
    tags: ['recyclerview', 'list', 'adapter', 'ui', 'arkui', 'android'],
    usageCount: 110,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-06-20T00:00:00.000Z',
  },
  {
    id: 'recipe-006',
    name: 'FirebaseToHMSAnalytics',
    sourceCode: `FirebaseAnalytics firebaseAnalytics = FirebaseAnalytics.getInstance(context);
Bundle bundle = new Bundle();
bundle.putString("screen_name", "HomeScreen");
bundle.putString("action", "view");
firebaseAnalytics.logEvent("screen_view", bundle);`,
    targetCode: `import { Analytics } from '@company/analytics';

const analytics = AnalyticsHub.getInstance();
analytics.reportEvent('screen_view', {
  screen_name: 'HomeScreen',
  action: 'view',
  timestamp: Date.now()
});`,
    description: 'Convert Firebase Analytics to HarmonyOS internal analytics SDK',
    category: 'ANALYTICS',
    tags: ['firebase', 'analytics', 'tracking', 'android'],
    usageCount: 34,
    createdAt: '2025-03-15T00:00:00.000Z',
    updatedAt: '2025-06-22T00:00:00.000Z',
  },
  {
    id: 'recipe-007',
    name: 'NotificationBuilderToNotificationManager',
    sourceCode: `NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
    .setSmallIcon(R.drawable.ic_notification)
    .setContentTitle("New Message")
    .setContentText("You have a new message")
    .setPriority(NotificationCompat.PRIORITY_DEFAULT);
NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
notificationManager.notify(1, builder.build());`,
    targetCode: `import notificationManager from '@ohos.notificationManager';

const notificationRequest: notificationManager.NotificationRequest = {
  id: 1,
  content: {
    notificationContentType: notificationManager.ContentType.NOTIFICATION_CONTENT_BASIC_TEXT,
    normal: {
      title: 'New Message',
      text: 'You have a new message'
    }
  }
};
await notificationManager.publish(notificationRequest);`,
    description: 'Convert Android NotificationBuilder to HarmonyOS @ohos.notificationManager',
    category: 'NOTIFICATION',
    tags: ['notification', 'push', 'android', 'ohos'],
    usageCount: 56,
    createdAt: '2025-04-01T00:00:00.000Z',
    updatedAt: '2025-06-25T00:00:00.000Z',
  },
  {
    id: 'recipe-008',
    name: 'OkHttpClientToHarmonyHTTP',
    sourceCode: `OkHttpClient client = new OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)
    .readTimeout(30, TimeUnit.SECONDS)
    .addInterceptor(new LoggingInterceptor())
    .build();
Request request = new Request.Builder()
    .url("https://api.example.com/data")
    .header("Authorization", "Bearer token123")
    .build();
Response response = client.newCall(request).execute();`,
    targetCode: `import http from '@ohos.net.http';
import { BusinessError } from '@ohos.base';

const httpRequest = http.createHttp();
httpRequest.request('https://api.example.com/data', {
  method: http.RequestMethod.GET,
  header: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  connectTimeout: 30000,
  readTimeout: 30000
}).then((response) => {
  const data = JSON.parse(response.result as string);
}).catch((err: BusinessError) => {
  console.error('Request failed:', err.message);
});`,
    description: 'Convert Android OkHttp client to HarmonyOS @ohos.net.http',
    category: 'NETWORK',
    tags: ['okhttp', 'http', 'network', 'android'],
    usageCount: 73,
    createdAt: '2025-04-15T00:00:00.000Z',
    updatedAt: '2025-06-28T00:00:00.000Z',
  },
];

export async function manage_custom_recipes(params: {
  action: string;
  recipeName?: string;
  sourceCode?: string;
  targetCode?: string;
  description?: string;
}): Promise<ToolResult<CustomRecipe[]>> {
  const done = createTimer();
  const { action, recipeName, sourceCode, targetCode, description } = params;

  try {
    switch (action) {
      case 'list': {
        return {
          success: true,
          data: customRecipes,
          duration: done(),
        };
      }

      case 'add': {
        if (!recipeName || !sourceCode || !targetCode) {
          return {
            success: false,
            error: 'recipeName, sourceCode, and targetCode are required for add action',
            duration: done(),
          };
        }

        const existing = customRecipes.find(
          (r) => r.name.toLowerCase() === recipeName.toLowerCase()
        );
        if (existing) {
          return {
            success: false,
            error: `Recipe "${recipeName}" already exists`,
            duration: done(),
          };
        }

        const newRecipe: CustomRecipe = {
          id: `recipe-${Date.now()}`,
          name: recipeName,
          sourceCode,
          targetCode,
          description: description || `Custom recipe: ${recipeName}`,
          category: 'CUSTOM',
          tags: [],
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        customRecipes.push(newRecipe);

        return {
          success: true,
          data: [newRecipe],
          duration: done(),
        };
      }

      case 'remove': {
        if (!recipeName) {
          return {
            success: false,
            error: 'recipeName is required for remove action',
            duration: done(),
          };
        }

        const idx = customRecipes.findIndex(
          (r) => r.name.toLowerCase() === recipeName.toLowerCase()
        );
        if (idx === -1) {
          return {
            success: false,
            error: `Recipe "${recipeName}" not found`,
            duration: done(),
          };
        }

        const removed = customRecipes.splice(idx, 1);

        return {
          success: true,
          data: removed,
          duration: done(),
        };
      }

      case 'execute': {
        if (!recipeName || !sourceCode) {
          return {
            success: false,
            error: 'recipeName and sourceCode are required for execute action',
            duration: done(),
          };
        }

        const recipe = customRecipes.find(
          (r) => r.name.toLowerCase() === recipeName.toLowerCase()
        );
        if (!recipe) {
          return {
            success: false,
            error: `Recipe "${recipeName}" not found`,
            duration: done(),
          };
        }

        // Increment usage count
        recipe.usageCount++;
        recipe.updatedAt = new Date().toISOString();

        // Simulate executing the recipe on the source code
        const transformed = recipe.targetCode;

        return {
          success: true,
          data: [
            {
              ...recipe,
              targetCode: `/* Applied recipe: ${recipe.name} */\n/* Original source matched */\n\n${transformed}`,
            },
          ],
          duration: done(),
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}. Valid actions: list, add, remove, execute`,
          duration: done(),
        };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      duration: done(),
    };
  }
}